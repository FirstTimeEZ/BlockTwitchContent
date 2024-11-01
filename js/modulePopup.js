import { CONFIG, STATE, requestState, logDebug } from "./exports/exports.js";
import { debounceEvent } from "./exports/debounce.js";

const DOM = {
  CONTENT_RULES: document.getElementsByName(CONFIG.SETTINGS.FRAGMENTS)
}

document.addEventListener("DOMContentLoaded", () => {
  requestState("popupModule", () => {
    if (!STATE.enabled) {
      DOM.CONTENT_RULES[0].disabled = true;
    }
    else {
      DOM.CONTENT_RULES[0].value = STATE.fragments_storage;
    }
  });
});

window.addEventListener('unload', function () {
  try {
    const capture = DOM.CONTENT_RULES[0].value;

    if (capture != undefined && capture.length > 1) {
      window.localStorage.setItem(CONFIG.SETTINGS.FRAGMENTS, DOM.CONTENT_RULES[0].value);
      browser.runtime.sendMessage({ requestForStateUpdate: true }); // PopupModule -> BackgroundModule
    }
  } catch {
    logDebug("popupModule::domDestroyed");
  }
});

if (DOM.CONTENT_RULES.length > 0) {
  DOM.CONTENT_RULES[0].addEventListener("input", debounceEvent((e) => {
    e.target.value !== "" ? window.localStorage.setItem(CONFIG.SETTINGS.FRAGMENTS, e.target.value) : window.localStorage.removeItem(CONFIG.SETTINGS.FRAGMENTS);
    browser.runtime.sendMessage({ requestForStateUpdate: true }); // PopupModule -> BackgroundModule
  }, 750));
}