import { STATE, requestState } from "./exports/app/state.js";
import { CONFIG, UI } from "./exports/app/_app-constants.js";
import { setupCollapsibles } from "./exports/ext/collapse.js";

const DOM = {
  DEBUG_OPTION: document.getElementById(CONFIG.SETTINGS.DEBUG),
  EXTRAS_OPTION: document.getElementById(CONFIG.SETTINGS.EXTRAS),
  ENCRYPTED_MEDIA_OPTION: document.getElementById(CONFIG.SETTINGS.ENCRYPTED_MEDIA),
  COLLAPSIBLES: document.getElementsByClassName("collapsible"),
}

DOM.DEBUG_OPTION.addEventListener(UI.CLICK, (e) => {
  window.localStorage.setItem(CONFIG.SETTINGS.DEBUG, e.target.checked);
  browser.runtime.sendMessage({ requestForStateUpdate: true }); // OptionsModule -> BackgroundModule
});

DOM.EXTRAS_OPTION.addEventListener(UI.CLICK, (e) => {
  window.localStorage.setItem(CONFIG.SETTINGS.EXTRAS, e.target.checked);
})

DOM.ENCRYPTED_MEDIA_OPTION.addEventListener(UI.CLICK, (e) => {
  window.localStorage.setItem(CONFIG.SETTINGS.ENCRYPTED_MEDIA, e.target.checked);
});

document.addEventListener(UI.DOM_LOADED, () => {
  requestState("optionsModule", () => {
    DOM.DEBUG_OPTION.checked = STATE.debugSetting;
    DOM.EXTRAS_OPTION.checked = STATE.disableChatExtras;
    DOM.ENCRYPTED_MEDIA_OPTION.checked = STATE.disableEncryptedMedia;
  });
});

setupCollapsibles(DOM.COLLAPSIBLES);