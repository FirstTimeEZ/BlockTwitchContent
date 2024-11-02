import { logDebug } from "./util.js";

export const STATE = {
  fragments: [],
  enabled: true,
  debug: false,
  supervisorEM: false,
  fragments_storage: "",
  hideBots: false,
  hideCommands: false
};

export function requestState(who, func) {
  browser.runtime.sendMessage({ requestForState: true },
    (response) => {
      if (response != undefined) {
        STATE.debug = response.state.debug;
        STATE.enabled = response.state.enabled;
        STATE.fragments = response.state.fragments;
        STATE.fragments_storage = response.state.fragments_storage;
        STATE.supervisorEM = response.state.supervisorEM;
        STATE.hideBots = response.state.hideBots;
        STATE.hideCommands = response.state.hideCommands;

        logDebug(who + "::refreshState", STATE);

        func != undefined ? func() : null;
      }
    });
}