const FRAGMENT_STORAGE_NAME = "fragments";

var CONTENT_RULES_DOM = this.document.getElementsByName(FRAGMENT_STORAGE_NAME);

if (CONTENT_RULES_DOM.length > 0) {
    CONTENT_RULES_DOM[0].addEventListener("input", DebounceEvent((e) => {
        e.target.value !== "" ? window.localStorage.setItem(FRAGMENT_STORAGE_NAME, e.target.value) : window.localStorage.removeItem(FRAGMENT_STORAGE_NAME);
        browser.runtime.sendMessage({ sendRequestForFragments: true }); // PopupWorker -> BackgroundWorker
    }, 750));
}

document.addEventListener("DOMContentLoaded", () => {
    var fragments = window.localStorage.getItem(FRAGMENT_STORAGE_NAME);
    if (fragments !== null && CONTENT_RULES_DOM.length > 0) {
        CONTENT_RULES_DOM[0].value = fragments;
    }
});

function DebounceEvent(func, delay) {
    let timeoutId;
    return function (...args) {
        timeoutId && clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}