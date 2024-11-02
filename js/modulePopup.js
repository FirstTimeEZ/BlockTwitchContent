import { CONFIG } from "./exports/constants.js";
import { STATE, requestState } from "./exports/state.js";
import { debounceEvent } from "./exports/debounce.js";
import { logDebug } from "./exports/util.js";

const DOM = {
  CONTENT_RULES: document.getElementById(CONFIG.SETTINGS.FRAGMENTS)
}

document.addEventListener("DOMContentLoaded", () => {
  requestState("popupModule", () => {
    if (!STATE.enabled) {
      DOM.CONTENT_RULES.disabled = true;
    }
    else {
      DOM.CONTENT_RULES.value = STATE.fragments_storage;
    }
  });
});

window.addEventListener('unload', function () {
  if (STATE.enabled) {
    try {
      const capture = DOM.CONTENT_RULES.value;

      if (capture != undefined && capture.length > 1) {
        window.localStorage.setItem(CONFIG.SETTINGS.FRAGMENTS, DOM.CONTENT_RULES.value);
        browser.runtime.sendMessage({ requestForStateUpdate: true }); // PopupModule -> BackgroundModule
      }

    } catch {
      logDebug("popupModule::domDestroyed");
    }
  }
});

DOM.CONTENT_RULES.addEventListener("input", debounceEvent((e) => {
  if (STATE.enabled) {
    e.target.value !== "" ? window.localStorage.setItem(CONFIG.SETTINGS.FRAGMENTS, e.target.value) : window.localStorage.removeItem(CONFIG.SETTINGS.FRAGMENTS);
    browser.runtime.sendMessage({ requestForStateUpdate: true }); // PopupModule -> BackgroundModule
  }
}, CONFIG.DEBOUNCE_MS));