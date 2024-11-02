import { CONFIG, C, UI } from "./exports/constants.js";

const DOM = {
  DEBUG_OPTION: document.getElementById(CONFIG.SETTINGS.DEBUG),
  ENCRYPTED_MEDIA_OPTION: document.getElementById(CONFIG.SETTINGS.ENCRYPTED_MEDIA),
  COLLAPSIBLES: document.getElementsByClassName("collapsible"),
}

DOM.DEBUG_OPTION.addEventListener(UI.CLICK, (e) => {
  window.localStorage.setItem(CONFIG.SETTINGS.DEBUG, e.target.checked);
  browser.runtime.sendMessage({ requestForStateUpdate: true }); // OptionsModule -> BackgroundModule
})

DOM.ENCRYPTED_MEDIA_OPTION.addEventListener(UI.CLICK, (e) => {
  window.localStorage.setItem(CONFIG.SETTINGS.ENCRYPTED_MEDIA, e.target.checked);
})

document.addEventListener(UI.DOM_LOADED, () => {
  const debugEnabled = window.localStorage.getItem(CONFIG.SETTINGS.DEBUG);
  const encryptedMediaDisabled = window.localStorage.getItem(CONFIG.SETTINGS.ENCRYPTED_MEDIA);

  DOM.DEBUG_OPTION.checked = debugEnabled !== null ? debugEnabled == C.TRUE : false;
  DOM.ENCRYPTED_MEDIA_OPTION.checked = encryptedMediaDisabled !== null ? encryptedMediaDisabled === C.TRUE : true;
});

for (var i = 0; i < DOM.COLLAPSIBLES.length; i++) {
  DOM.COLLAPSIBLES[i].addEventListener(UI.CLICK, function () {
    this.classList.toggle(UI.ACTIVE);
    const content = this.nextElementSibling;
    content.style.maxHeight ? (content.style.maxHeight = null) : content.style.maxHeight = content.scrollHeight + C.PX;
  });
}