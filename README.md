# ScrollObserver
Triggers specified functions (`onIntersect`, `onIntersecting`, and `onDeintersect`) when an element is scrolled into view or within the trigger area. Uses an IntersectionObserver by default, but can be set to use a window scroll event listener.


## Usage
Here's a basic example of a class:
```JS
// intersect starts when observedElement is within rootMargin
const observedElement = document.getElementById('observed-element')
const onIntersect = () => observedElement.classList.add('active')

const intersectSettings = {
    marginBottom: -200 // activate 200px from the bottom of the viewport.
    onIntersect: onIntersect
}
const observer = new ScrollObserver(observedElement, intersectSettings)
```

<!-- ## Methods & Properties -->

## Constructor
```JS
new ScrollObserver(observedElement, intersectSettings, usePseudoObserver = false)
```
* `{HTMLElement} observedElement` - The element that is observed by the IntersectionObserver. functions are activated when this intersects with root (trigger area).
* `{IntersectSettingsObject} intersectSettings` - trigger positions & intersection functions. See options for intersectSettings below.
* `{Boolean} usePseudoObserver` - [false] If true, the IntersectionObserver will be replaced with a window scroll event listener that is always checking for the intersection. This can be changed after initialization. __Note:__ Use this for instances when root will never directly contact the observedElement or for any reason that would cause IntersectionObserver not to trigger, otherwise prefer leaving this false.

### Intersect Settings
* `marginTop {String | Number}` [0] Distance the top scroll trigger is above top of the viewport. Accepts number string (px/%) or number.
* `marginBottom {String | Number}` [0] - Distance the bottom scroll trigger is below bottom of the viewport. Accepts number string (px/%) or number.
* `onIntersect(entry, percentScrolled) {Function}` [null] - Function fires when intersect begins.
    * __entry__ {IntersectionObserverEntry} - entry when entry.isIntersecting becomes true, receives arguments entry and percentScrolled arguments.
    * __percentScrolled__ {Float}` - number between 0 and 1 how far along root is through the height of the intersection area. 0 = at top trigger, 1 = at bottom trigger.
* `onDeintersect(entry, percentScrolled) {Function}` [null] - Function fires when intersect ends.
* `onIntersecting(percentScrolled) {Function}` [null] - Function fires while scrolling through intersection area. receives percentScrolled argument.

<br>

## Methods
* `observe()` - Starts observing observedElement for intersect.
* `unobserve()` - Stops observing observedElement for intersect.
* `getPercentScrolled(constrainRange = true)` - Returns percent (float between 0 & 1) of how far along root is through the height of the intersection area. 0 = at top trigger, 1 = at bottom trigger. if constrainRange = false, allows for numbers < 0 & > 1.
* `getPseudoEntry()` - Returns an object with the same properties as an 'IntersectionObserverEntry' calculated without using an IntersectionObserver instance.
* `resetObserver()` - Removes current observer and and creates a new instance matching the same observe state.
* `updateIntersectSettings(intersectSettings)` - Updates the intersect settings for the keys provided and uses the previous entries that were not specified. this causes the observer to reset.
<br>

## Properties
* `observedElement {HTMLElement}` - The element that is observed by the IntersectionObserver to trigger the onIntersect, onIntersecting, & onDeintersect functions.
* `hasScrollListener {Boolean}` - True if the scroll listener for onIntersecting is active.
* `intersectionObserver {IntersectionObserver | pseudoObserver}` - Instance of IntersectionObserver or pseudoObserver.
* `isInitialized {Boolean}` - True if ScrollObserver has been initialized.
* `isObserving {Boolean}` - True if intersectionObserver is observing observedElement.
* `rootRect {Object}` - (Getter) Returns bounding rect of root.
* `isIntersecting {Boolean}` - (Getter) True if root is intersecting observedElement.
* `intersectSettings {IntersectSettingsObject}` - (Getter) Returns intersectSettings with defaults if not set during init.
* `usePseudoObserver {Boolean}` - (Getter / Setter) Specifies if IntersectionObserver or pseudoObserver will be used to observe observedElement. Toggling this after init will replace the existing observer and match the previous observe state.
* `intersectionRect {Object}` - (Getter) Returns bouding rect of intersection area. Same as IntersectionObserverEntry.intersectionRect calculated without using an IntersectionObserver instance.

<br>

## Example Script

```JS
const observedElement = document.getElementById('observed')
const outputState = document.getElementById('output-state')
const outputScrollPercent = document.getElementById('output-scroll-percent')

function onIntersecting(scrollPercent) {
    outputScrollPercent.innerText = `${Math.round(scrollPercent * 100)}%`
}

function onIntersect(entry, isTop) {
    if (isTop) outputState.innerText = "Intersecting (Top)"
    else outputState.innerText = "Intersecting (Bottom)"
}

function onDeintersect(entry, isTop) {
    if (isTop) outputState.innerText = "Not Intersecting (Top)"
    else outputState.innerText = "Not Intersecting (Bottom)"
}

const observer = new ScrollObserver(observedElement, {
    marginTop: '-20%',
    marginBottom: '-20%',
    onIntersect: onIntersect,
    onIntersecting: onIntersecting,
    onDeintersect: onDeintersect
})

```
see the result of this script in: `/examples/simple-observer.html`
