import { CONFIG, C } from "./constants.js";
import { STATE } from "./state.js";

export function getStorageItemStates() {
  loadDebugSetting();
  loadEncryptedMediaSetting();
  loadFragments();
  loadHideBotsSetting();
  loadHideCommandsSetting();
  loadChatExtrasSetting();

  return { state: STATE }
}

export function loadDebugSetting() {
  const debugSetting = window.localStorage.getItem(CONFIG.SETTINGS.DEBUG);

  if (debugSetting !== null) {
    STATE.debugSetting = debugSetting === C.TRUE;
  } else {
    window.localStorage.setItem(CONFIG.SETTINGS.DEBUG, false);
    STATE.debugSetting = false;
  }
}

export function loadHideBotsSetting() {
  const hideBots = window.localStorage.getItem(CONFIG.SETTINGS.HIDE_BOTS);

  if (hideBots !== null) {
    STATE.hideBots = hideBots === C.TRUE;
  } else {
    window.localStorage.setItem(CONFIG.SETTINGS.HIDE_BOTS, false);
    STATE.hideBots = false;
  }
}

export function loadHideCommandsSetting() {
  const hideCommands = window.localStorage.getItem(CONFIG.SETTINGS.HIDE_COMMANDS);

  if (hideCommands !== null) {
    STATE.hideCommands = hideCommands === C.TRUE;
  } else {
    window.localStorage.setItem(CONFIG.SETTINGS.HIDE_COMMANDS, false);
    STATE.hideCommands = false;
  }
}

export function loadEncryptedMediaSetting() {
  const disableEncryptedMedia = window.localStorage.getItem(CONFIG.SETTINGS.ENCRYPTED_MEDIA);

  if (disableEncryptedMedia !== null) {
    STATE.disableEncryptedMedia = disableEncryptedMedia === C.TRUE;
  }
  else {
    window.localStorage.setItem(CONFIG.SETTINGS.ENCRYPTED_MEDIA, C.TRUE);
    STATE.disableEncryptedMedia = true;
  }
}

export function loadChatExtrasSetting() {
  const disableChatExtras = window.localStorage.getItem(CONFIG.SETTINGS.EXTRAS);

  if (disableChatExtras !== null) {
    STATE.disableChatExtras = disableChatExtras === C.TRUE;
  } else {
    window.localStorage.setItem(CONFIG.SETTINGS.EXTRAS, true);
    STATE.disableChatExtras = true;
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