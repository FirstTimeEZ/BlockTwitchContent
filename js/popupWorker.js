const CONFIG = {
  SETTINGS: {
    FRAGMENTS: "fragments",
    DEBUG: "debugEnabled",
    ENCRYPTED_MEDIA: "encryptedMedia"
  }
};

const DOM = {
  CONTENT_RULES: this.document.getElementsByName(CONFIG.SETTINGS.FRAGMENTS)
}

function DebounceEvent(func, delay) {
  let timeoutId;
  return function (...args) {
    timeoutId && clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

document.addEventListener("DOMContentLoaded", () => {
  var fragments = window.localStorage.getItem(CONFIG.SETTINGS.FRAGMENTS);
  if (fragments !== null && DOM.CONTENT_RULES.length > 0) {
    DOM.CONTENT_RULES[0].value = fragments;
  }
});

if (DOM.CONTENT_RULES.length > 0) {
  DOM.CONTENT_RULES[0].addEventListener("input", DebounceEvent((e) => {
    e.target.value !== "" ? window.localStorage.setItem(CONFIG.SETTINGS.FRAGMENTS, e.target.value) : window.localStorage.removeItem(CONFIG.SETTINGS.FRAGMENTS);
    browser.runtime.sendMessage({ sendRequestForFragments: true }); // PopupWorker -> BackgroundWorker
  }, 750));
}