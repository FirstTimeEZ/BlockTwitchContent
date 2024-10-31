import { CONFIG, STATE } from "./exports.js";
import { debounceEvent } from "./exports.js";
import { logDebug } from "./exports.js";
import { RequestSettings } from "./exports.js";

const DOM = {
  CONTENT_RULES: document.getElementsByName(CONFIG.SETTINGS.FRAGMENTS)
}

document.addEventListener("DOMContentLoaded", () => {
  var fragments = window.localStorage.getItem(CONFIG.SETTINGS.FRAGMENTS);
  if (fragments !== null && DOM.CONTENT_RULES.length > 0) {
    DOM.CONTENT_RULES[0].value = fragments;
  }
});

if (DOM.CONTENT_RULES.length > 0) {
  DOM.CONTENT_RULES[0].addEventListener("input", debounceEvent((e) => {
    e.target.value !== "" ? window.localStorage.setItem(CONFIG.SETTINGS.FRAGMENTS, e.target.value) : window.localStorage.removeItem(CONFIG.SETTINGS.FRAGMENTS);
    browser.runtime.sendMessage({ sendRequestForFragments: true }); // PopupModule -> BackgroundModule
  }, 750));
}

window.addEventListener('unload', function () {
  try {
    const capture = DOM.CONTENT_RULES[0].value;

    if (capture != undefined && capture.length > 1) {
      logDebug('Saving rules on close', DOM.CONTENT_RULES[0].value);
      window.localStorage.setItem(CONFIG.SETTINGS.FRAGMENTS, DOM.CONTENT_RULES[0].value);
      browser.runtime.sendMessage({ sendRequestForFragments: true }); // PopupModule -> BackgroundModule
    }
  } catch {
    logDebug("DOM is already destroyed");
  }
})

RequestSettings("popupWorker", () => {
  if (!STATE.enabled) {
    console.log("Prompt is disabled because extension is disabled");
    DOM.CONTENT_RULES[0].disabled = true;
  }
});