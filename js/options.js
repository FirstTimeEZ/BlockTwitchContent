const DEBUG_SETTING = "debugEnabled";
const ENCRYPTED_MEDIA_SETTING = "encryptedMedia";

var DEBUG_DOM = this.document.getElementsByName(DEBUG_SETTING);
var ENCRYPTED_MEDIA_DOM = this.document.getElementsByName(ENCRYPTED_MEDIA_SETTING);

var COLLAPSIBLES_DOM = document.getElementsByClassName("collapsible");

for (var i = 0; i < COLLAPSIBLES_DOM.length; i++) {
  COLLAPSIBLES_DOM[i].addEventListener("click", function () {
    this.classList.toggle("active");
    var content = this.nextElementSibling;
    content.style.maxHeight ? (content.style.maxHeight = null) : content.style.maxHeight = content.scrollHeight + "px";
  });
}

DEBUG_DOM[0].addEventListener("click", (e) => {
  window.localStorage.setItem(DEBUG_SETTING, e.target.checked);
  browser.runtime.sendMessage({ sendRequestForDebug: true }); // Options -> BackgroundWorker
})

ENCRYPTED_MEDIA_DOM[0].addEventListener("click", (e) => {
  window.localStorage.setItem(ENCRYPTED_MEDIA_SETTING, e.target.checked);
})

document.addEventListener('DOMContentLoaded', () => {
  var debugEnabled = window.localStorage.getItem(DEBUG_SETTING);
  DEBUG_DOM[0].checked = debugEnabled !== null ? debugEnabled == "true" : false;

  var encryptedMedia = window.localStorage.getItem(ENCRYPTED_MEDIA_SETTING);
  ENCRYPTED_MEDIA_DOM[0].checked = encryptedMedia !== null ? encryptedMedia == "true" : true;
});