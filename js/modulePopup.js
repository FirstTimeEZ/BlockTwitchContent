import { CONFIG, UI, C, PM } from "./exports/constants.js";
import { STATE, requestState } from "./exports/state.js";
import { debounceEvent } from "./exports/debounce.js";
import { logDebug } from "./exports/util.js";
import { createDownload } from "./exports/download.js";

const DOM = {
  CONTENT_RULES: document.getElementById(CONFIG.SETTINGS.FRAGMENTS),
  SETTINGS_BUTTON: document.getElementById("settingsButton"),
  DOWNLOAD_BUTTON: document.getElementById("downloadButton"),
}

const popupSize = window.localStorage.getItem("popupSize");
if (popupSize !== null) {
  const json = JSON.parse(popupSize);

  DOM.CONTENT_RULES.style.width = json.w;
  DOM.CONTENT_RULES.style.height = json.h;
}

const observer = new MutationObserver(debounceEvent(() => {
  DOM.CONTENT_RULES != undefined && window.localStorage.setItem("popupSize", JSON.stringify({ w: DOM.CONTENT_RULES.style.width, h: DOM.CONTENT_RULES.style.height }));
}, 250));

document.addEventListener(UI.DOM_LOADED, () => {
  requestState(PM.POPUP, () => {
    if (!STATE.enabled) {
      DOM.CONTENT_RULES.disabled = true;
    }
    else {
      DOM.CONTENT_RULES.value = STATE.fragments_storage;
    }
  });
});

window.addEventListener(UI.UNLOAD, function () {
  if (STATE.enabled) {
    try {
      const capture = DOM.CONTENT_RULES.value;

      if (capture != undefined && capture.length > 1) {
        window.localStorage.setItem(CONFIG.SETTINGS.FRAGMENTS, DOM.CONTENT_RULES.value);
        browser.runtime.sendMessage({ requestForStateUpdate: true }); // PopupModule -> BackgroundModule
      }

    } catch {
      logDebug(PM.DESTROYED);
    }
  }
});

DOM.CONTENT_RULES.addEventListener(UI.INPUT, debounceEvent((e) => {
  if (STATE.enabled) {
    e.target.value !== C.EMPTY ? window.localStorage.setItem(CONFIG.SETTINGS.FRAGMENTS, e.target.value) : window.localStorage.removeItem(CONFIG.SETTINGS.FRAGMENTS);
    browser.runtime.sendMessage({ requestForStateUpdate: true }); // PopupModule -> BackgroundModule
  }
}, CONFIG.DEBOUNCE_MS));

DOM.CONTENT_RULES.addEventListener(UI.MOUSE_DOWN, () => observer.observe(DOM.CONTENT_RULES, { attributes: true, attributeFilter: [UI.STYLE] }));

DOM.CONTENT_RULES.addEventListener(UI.MOUSE_UP, () => { observer.takeRecords(); observer.disconnect(); });

DOM.DOWNLOAD_BUTTON.addEventListener(UI.CLICK, () => debounceEvent(createDownload(STATE.fragments_storage, "fragments"), 200));

//DOM.SETTINGS_BUTTON.addEventListener(UI.CLICK, (e) => {  console.log("Clicked", e);});