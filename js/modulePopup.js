import { CONFIG, UI, C, PM } from "./exports/constants.js";
import { STATE, requestState } from "./exports/state.js";
import { debounceEvent } from "./exports/debounce.js";
import { logDebug } from "./exports/util.js";
import { createDownload } from "./exports/download.js";

const DOM = {
  CONTENT_RULES: document.getElementById(CONFIG.SETTINGS.FRAGMENTS),
  HIDE_BOTS: document.getElementById(CONFIG.SETTINGS.HIDE_BOTS),
  HIDE_COMMANDS: document.getElementById(CONFIG.SETTINGS.HIDE_COMMANDS),
  DOWNLOAD_BUTTON: document.getElementById("downloadButton"),
  SETTINGS_BUTTON: document.getElementById("settingsButton"),
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
      DOM.HIDE_BOTS.checked = STATE.hideBots;
      DOM.HIDE_COMMANDS.checked = STATE.hideCommands;
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

DOM.DOWNLOAD_BUTTON.addEventListener(UI.CLICK, () => debounceEvent(createDownload(STATE.fragments_storage, CONFIG.SETTINGS.FRAGMENTS), 200));

DOM.HIDE_BOTS.addEventListener(UI.CLICK, (e) => {
  if (e.target.checked !== null) {
    STATE.hideBots = e.target.checked;
    window.localStorage.setItem(CONFIG.SETTINGS.HIDE_BOTS, STATE.hideBots);
    browser.runtime.sendMessage({ requestForStateUpdate: true });
  }
});

DOM.HIDE_COMMANDS.addEventListener(UI.CLICK, (e) => {
  if (e.target.checked !== null) {
    STATE.hideCommands = e.target.checked;
    window.localStorage.setItem(CONFIG.SETTINGS.HIDE_COMMANDS, STATE.hideCommands);
    browser.runtime.sendMessage({ requestForStateUpdate: true });
  }
});

DOM.SETTINGS_BUTTON.addEventListener(UI.CLICK, (e) => browser.runtime.sendMessage({ requestForSettingsTab: true }));