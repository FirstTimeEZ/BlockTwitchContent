import { STATE } from "./state.js";
import { CONFIG } from "./constants.js";

export const decodeData = (data, decoder) => data.length === 1 ? decoder.decode(data[0]) : data.reduce((acc, chunk, index) => { const stream = index !== data.length - 1; return acc + decoder.decode(chunk, { stream }); }, '')

export const isValidSender = sender => sender.id === CONFIG.SENDER_UUID && (sender.envType === CONFIG.SCRIPTS.CONTENT || sender.envType === CONFIG.SCRIPTS.OPTIONS);

export const logDebug = (...args) => STATE.debug && console.log(...args);

export const logError = (...args) => console.error(...args);