import { CONFIG } from "./module.js";
import { STATE } from "./module.js";
import { debounceEvent } from "./module.js";
import { logDebug } from "./module.js";

const DOM = {
  CONTENT_RULES: document.getElementsByName(CONFIG.SETTINGS.FRAGMENTS)
}

function RequestSettings(who) { // PopupWorker -> BackgroundWorker
  browser.runtime.sendMessage({ checkDebugSettingRequest: true },
    (response) => { // BackgroundWorker -> PopupWorker
      if (response != undefined) {
        console.log(who, response);
        STATE.debug = response.debugEnabled;
        STATE.enabled = response.extensionEnabled;

        if (!STATE.enabled) {
          console.log("Prompt is disabled because extension is disabled");
          DOM.CONTENT_RULES[0].disabled = true;
        }
      }
    });
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
    browser.runtime.sendMessage({ sendRequestForFragments: true }); // PopupWorker -> BackgroundWorker
  }, 750));
}

window.addEventListener('unload', function () {
  try {
    const capture = DOM.CONTENT_RULES[0].value;

    if (capture != undefined && capture.length > 1) {
      logDebug('Saving rules on close', DOM.CONTENT_RULES[0].value);
      window.localStorage.setItem(CONFIG.SETTINGS.FRAGMENTS, DOM.CONTENT_RULES[0].value);
      browser.runtime.sendMessage({ sendRequestForFragments: true }); // PopupWorker -> BackgroundWorker
    }
  } catch {
    logDebug("DOM is already destroyed");
  }
})

RequestSettings("popupWorker");