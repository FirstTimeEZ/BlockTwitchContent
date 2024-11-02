import { CONFIG } from "./constants.js";
import { logDebug } from "./util.js";

export function insertFragmentListener(matches, decodedString) {
  const insert = createFragmentListener(matches);
  const result = decodedString.replace(CONFIG.REGEX.FRAGMENT, insert);

  logDebug("backgroundModule::fragmentListenerInserted", result.includes(insert));

  return result;
}

export function removeFragmentListener(matches, decodedString) {
  const insert = createFragmentListener(matches);
  const originalCode = `${matches[1]}.messageProcessor.processMessage(${matches[2]}.data)`;

  if (decodedString.includes(insert)) {
    const result = decodedString.replace(insert, originalCode);
    logDebug("backgroundModule::mixinRemoved", result.includes(insert));
    return result;
  }

  return decodedString;
}

export function createFragmentListener(matches) {
  return `new Promise((resolve) => {
    const val = Math.floor(Math.random() * 100000000);
    const handler = (e2) => {
      if (e2.data.response !== undefined && e2.data.completed && e2.data.random === val) {
        resolve(e2.data.response);
        window.removeEventListener('message', handler);
      }
    };
    window.addEventListener('message', handler);
    window.postMessage({ 
      random: val, 
      type: 'fp', 
      text: ${matches[2]}.data 
    });
  }, 'https://www.twitch.tv').then(response => {
    if(response === 'w'){ 
      ${matches[1]}.messageProcessor.processMessage(${matches[2]}.data)
    }
  });`;
}