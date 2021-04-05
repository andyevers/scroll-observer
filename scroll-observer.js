/**
* @typedef {Object} IntersectSettingsObject
* @property {String} marginTop [0] accepts string (px/%) or number - =rootMargin top. Distance the top scroll trigger is above top of the viewport
* @property {String} marginBottom [0] accepts string (px/%) or number - =rootMargin bottom. Distance the bottom scroll trigger is below from bottom of the viewport
* @property {Function} onIntersect(entry, isTop) [null] - function that fires when intersect starts
* @property {Function} onDeintersect(entry, isTop) [null] - function that fires when intersect ends
* @property {Function} onIntersecting(percentScrolled) [null] - function that fires on scroll while intersecting
*/

/**
 * Adds an IntersectionObserver to trigger functions onIntersect, onIntersecting, and onDeintersect
 */
class ScrollObserver {
    /**
     * @param {HTMLElement} observedElement The element that is observed by the IntersectionObserver
     * @param {IntersectSettingsObject} intersectSettings (marginTop, marginBottom, onIntersect, onDeintersect, onIntersecting) trigger positions & intersection functions
     * @param {Boolean} usePseudoObserver [false] Whether an IntersectionObserver or a window scroll event should be used to detect intersection
     */
    constructor(observedElement, intersectSettings, usePseudoObserver = false) {
        this.observedElement = observedElement
        this.hasScrollListener = false // true if the scroll event listener for the onIntersecting function is active
        this.intersectionObserver = null // becomes instance of IntersectionObserver on _init
        this.isInitialized = false
        this.isObserving = false
        this.usePseudoObserver = usePseudoObserver
        this._intersectSettings = intersectSettings

        //________METHODS_________//
        this.observe = () => {
            const { observedElement, intersectionObserver } = this
            if (intersectionObserver) {
                if (intersectionObserver instanceof IntersectionObserver) intersectionObserver.observe(observedElement)
                else intersectionObserver.observe()
            }
            this.isObserving = true
        }

        this.unobserve = () => {
            const { observedElement, intersectionObserver } = this
            if (intersectionObserver) {
                if (intersectionObserver instanceof IntersectionObserver) intersectionObserver.unobserve(observedElement)
                else intersectionObserver.unobserve()
            }
            this.isObserving = false
        }

        this.getPercentScrolled = (constrainRange = true) => {
            const { observedElement, rootRect } = this

            const elementRect = observedElement.getBoundingClientRect()
            const elementTopPageDepth = scrollY + elementRect.top
            const elementBottomPageDepth = scrollY + elementRect.bottom
            const rootTopPageDepth = scrollY + rootRect.top

            const intersectStartPosition = elementTopPageDepth - rootRect.height
            const intersectAreaHeight = elementBottomPageDepth - intersectStartPosition

            const distanceBelowElementTop = rootTopPageDepth - intersectStartPosition
            const percentScrolled = distanceBelowElementTop / intersectAreaHeight
            if (constrainRange) return percentScrolled > 1 ? 1 : percentScrolled < 0 ? 0 : percentScrolled
            else return percentScrolled
        }

        this.getPseudoEntry = () => {
            const getRectArea = rect => rect.width * rect.height
            const elementRect = this.observedElement.getBoundingClientRect()
            const intersectionRect = this.intersectionRect
            const intersectionRatio = getRectArea(intersectionRect) / getRectArea(elementRect)

            return {
                boundingClientRect: elementRect,
                intersectionRatio: intersectionRatio,
                intersectionRect: intersectionRect,
                isIntersecting: this.isIntersecting,
                rootBounds: this.rootRect,
                target: this.observedElement,
                time: performance.now()
            }
        }

        this._createObserver = () => {
            const { _createIntersectionObserver, _createPseudoObserver, usePseudoObserver } = this
            const createRequestedObserver = usePseudoObserver === true ? _createPseudoObserver : _createIntersectionObserver
            return createRequestedObserver()
        }

        this._createIntersectionObserver = () => {
            const { intersectSettings, getPercentScrolled, _toMarginString, _observerCallback } = this
            const { marginTop, marginBottom, onIntersecting } = intersectSettings

            const observerOptions = {
                rootMargin: `${_toMarginString(marginTop)} 0px ${_toMarginString(marginBottom)} 0px`,
                threshold: [0, 1]
            }

            const onIntersectingScroll = () => onIntersecting(getPercentScrolled())
            return new IntersectionObserver((entries) => _observerCallback(entries, onIntersectingScroll), observerOptions)
        }

        this._createPseudoObserver = () => {
            const { intersectSettings, _observerCallback, getPercentScrolled, getPseudoEntry } = this
            const { onIntersecting } = intersectSettings

            const onIntersectingScroll = () => onIntersecting(getPercentScrolled())
            let isIntersectTriggered = false

            const onScroll = () => {
                const pseudoEntry = getPseudoEntry()
                const intersectTriggered = pseudoEntry.isIntersecting && !isIntersectTriggered
                const deintersectTriggered = !pseudoEntry.isIntersecting && isIntersectTriggered

                if (intersectTriggered) {
                    _observerCallback([pseudoEntry], onIntersectingScroll)
                    isIntersectTriggered = true
                }
                if (deintersectTriggered) {
                    _observerCallback([pseudoEntry], onIntersectingScroll)
                    isIntersectTriggered = false
                }
            }

            const pseudoObserver = {}
            pseudoObserver.observe = () => {
                if (!this.isInitialized) onScroll()
                window.addEventListener('scroll', onScroll)
            }
            pseudoObserver.unobserve = () => {
                window.removeEventListener('scroll', onScroll)
            }
            return pseudoObserver
        }

        this._observerCallback = (entries, onIntersectingScroll) => {
            const { intersectSettings, hasScrollListener, getPercentScrolled } = this
            const { onIntersect, onIntersecting, onDeintersect } = intersectSettings
            const percentScrolled = getPercentScrolled()

            entries.forEach(entry => {
                if (percentScrolled === 0) this.isTop = true
                if (percentScrolled === 1) this.isTop = false

                if (entry.isIntersecting) {
                    if (onIntersect) onIntersect(entry, this.isTop)
                    if (onIntersecting && !hasScrollListener) {
                        window.addEventListener('scroll', onIntersectingScroll)
                        this.hasScrollListener = true
                    }
                } else {
                    if (onDeintersect) onDeintersect(entry, this.isTop)
                    if (onIntersecting) {
                        window.removeEventListener('scroll', onIntersectingScroll)
                        this.hasScrollListener = false
                    }
                }
            })
        }

        this._toMarginNumber = margin => {
            if (typeof margin === 'number') return margin
            const parsedMargin = margin.match(/[-\d\.]+|\D+/g),
                num = parseFloat(parsedMargin[0]),
                unit = parsedMargin[1]

            if (unit === '%') return num / 100 * innerHeight
            else return num
        }

        this._toMarginString = margin => {
            return typeof margin === 'number' ? `${margin}px` : margin
        }

        this._init = () => {
            this.intersectionObserver = this._createObserver()
            this.observe()
            this.isInitialized = true
        }

        this._init()
    }

    get usePseudoObserver() {
        return this._usePseudoObserver
    }

    set usePseudoObserver(bool) {
        const { isObserving, isInitialized, usePseudoObserver, _createObserver, observe, unobserve } = this
        this._usePseudoObserver = bool
        if (bool === usePseudoObserver || !isInitialized) return

        if (isObserving) unobserve()
        this.intersectionObserver = _createObserver()
        if (isObserving) observe()
    }

    get rootRect() {
        let { marginTop, marginBottom } = this.intersectSettings
        const { _toMarginNumber } = this

        marginTop = _toMarginNumber(marginTop)
        marginBottom = _toMarginNumber(marginBottom)

        const height = innerHeight + marginTop + marginBottom
        const top = marginTop * -1
        const bottom = top + height

        return {
            top: top,
            right: window.innerWidth,
            bottom: bottom,
            left: 0,
            height: height,
            width: window.innerWidth,
            x: 0,
            y: top
        }
    }

    get intersectionRect() {
        if (!this.isIntersecting) return { top: 0, right: 0, bottom: 0, left: 0, height: 0, width: 0, x: 0, y: 0 }

        const rr = this.rootRect
        const er = this.observedElement.getBoundingClientRect()

        const top = Math.max(rr.top, er.top),
            right = Math.min(rr.right, er.right),
            bottom = Math.min(rr.bottom, er.bottom),
            left = Math.max(rr.left, er.left)

        const intersectionRect = {
            top: top,
            right: right,
            bottom: bottom,
            left: left,
            height: bottom - top,
            width: right - left,
            x: left,
            y: top
        }

        Object.entries(intersectionRect).forEach(([k, v]) => {
            intersectionRect[k] = Math.max(v, 0)
        })

        return intersectionRect
    }

    get isIntersecting() {
        const { getPercentScrolled } = this
        const percentScrolled = getPercentScrolled(false)
        return percentScrolled >= 0 && percentScrolled <= 1
    }

    get intersectSettings() {
        const { marginTop, marginBottom, onIntersect, onIntersecting, onDeintersect } = this._intersectSettings
        return {
            marginTop: marginTop || 0,
            marginBottom: marginBottom || 0,
            onIntersect: onIntersect || null,
            onIntersecting: onIntersecting || null,
            onDeintersect: onDeintersect || null,
        }
    }
}
