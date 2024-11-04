import { logDebug } from "./util.js";

export const STATE = {
  fragments: [],
  enabled: true,
  debugSetting: false,
  disableEncryptedMedia: false,
  fragments_storage: "",
  hideBots: false,
  hideCommands: false,
  disableChatExtras: true,
};

export function requestState(who, func) {
  browser.runtime.sendMessage({ requestForState: true },
    (response) => {
      if (response != undefined) {
        STATE.debugSetting = response.state.debugSetting;
        STATE.enabled = response.state.enabled;
        STATE.fragments = response.state.fragments;
        STATE.fragments_storage = response.state.fragments_storage;
        STATE.disableEncryptedMedia = response.state.disableEncryptedMedia;
        STATE.hideBots = response.state.hideBots;
        STATE.hideCommands = response.state.hideCommands;
        STATE.disableChatExtras = response.state.disableChatExtras;

        logDebug(who + "::refreshState", STATE);

        func != undefined ? func() : null;
      }
    });
}