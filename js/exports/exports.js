import { CONFIG } from "./constants.js";

export const STATE = {
  fragments: [],
  enabled: true,
  debug: false,
  supervisorEM: false,
  fragments_storage: ""
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

        logDebug(who + "::refreshState", STATE);

        func != undefined ? func() : null;
      }
    });
}

export const decodeData = (data, decoder) => data.length === 1 ? decoder.decode(data[0]) : data.reduce((acc, chunk, index) => { const stream = index !== data.length - 1; return acc + decoder.decode(chunk, { stream }); }, '')

export const isValidSender = sender => sender.id === CONFIG.SENDER_UUID && (sender.envType === CONFIG.SCRIPTS.CONTENT || sender.envType === CONFIG.SCRIPTS.OPTIONS);

export const logDebug = (...args) => STATE.debug && console.log(...args);

export const logError = (...args) => console.error(...args);