import { CONFIG } from "./exports.js";

const DOM = {
  DEBUG_OPTION: document.getElementsByName(CONFIG.SETTINGS.DEBUG),
  ENCRYPTED_MEDIA_OPTION: document.getElementsByName(CONFIG.SETTINGS.ENCRYPTED_MEDIA),
  COLLAPSIBLES: document.getElementsByClassName("collapsible")
}

DOM.DEBUG_OPTION[0].addEventListener("click", (e) => {
  window.localStorage.setItem(CONFIG.SETTINGS.DEBUG, e.target.checked);
  browser.runtime.sendMessage({ sendRequestForSettings: true }); // OptionsModule -> BackgroundModule
})

DOM.ENCRYPTED_MEDIA_OPTION[0].addEventListener("click", (e) => {
  window.localStorage.setItem(CONFIG.SETTINGS.ENCRYPTED_MEDIA, e.target.checked);
})

document.addEventListener('DOMContentLoaded', () => {
  const debugEnabled = window.localStorage.getItem(CONFIG.SETTINGS.DEBUG);
  const encryptedMediaDisabled = window.localStorage.getItem(CONFIG.SETTINGS.ENCRYPTED_MEDIA);

  DOM.DEBUG_OPTION[0].checked = debugEnabled !== null ? debugEnabled == "true" : false;
  DOM.ENCRYPTED_MEDIA_OPTION[0].checked = encryptedMediaDisabled !== null ? encryptedMediaDisabled === "true" : true;
});

for (var i = 0; i < DOM.COLLAPSIBLES.length; i++) {
  DOM.COLLAPSIBLES[i].addEventListener("click", function () {
    this.classList.toggle("active");
    const content = this.nextElementSibling;
    content.style.maxHeight ? (content.style.maxHeight = null) : content.style.maxHeight = content.scrollHeight + "px";
  });
}