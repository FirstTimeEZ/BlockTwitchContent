import { CONFIG, C } from "./constants.js";
import { STATE } from "./state.js";

export function getStorageItemStates() {
  loadDebugSetting();
  loadEncryptedMediaSetting();
  loadFragments();

  return { state: STATE }
}

export function loadDebugSetting() {
  const debugSetting = window.localStorage.getItem(CONFIG.SETTINGS.DEBUG);

  STATE.debug = debugSetting === C.TRUE;
}

export function loadEncryptedMediaSetting() {
  const encryptedMedia = window.localStorage.getItem(CONFIG.SETTINGS.ENCRYPTED_MEDIA);

  if (encryptedMedia !== null) {
    STATE.supervisorEM = encryptedMedia === C.TRUE;
  }
  else {
    window.localStorage.setItem(CONFIG.SETTINGS.ENCRYPTED_MEDIA, C.TRUE);
    STATE.supervisorEM = true;
  }
}

export function loadFragments() {
  const fragments = window.localStorage.getItem(CONFIG.SETTINGS.FRAGMENTS);

  if (fragments !== null) {
    STATE.fragments_storage = fragments;
    STATE.fragments = fragments.split(C.NEW_LINE);
  }
  else {
    STATE.fragments_storage = [];
    STATE.fragments = [];
  }
}