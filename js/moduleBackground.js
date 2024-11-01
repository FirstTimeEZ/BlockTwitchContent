import { CONFIG, STATE } from "./exports/exports.js";
import { loadOptions, getFragments } from "./exports/exports.js";
import { decodeData, isValidSender, logDebug, logError } from "./exports/exports.js";
import { broadcastToTwitchTabs, broadcastToTwitchTabsCallback,  reloadTab } from "./exports/tabs.js";
import { definedContentRules } from "./exports/content-rules.js";

function insertFragmentListener(matches, decodedString) {
  const insert = createPromiseWrapper(matches);
  const result = decodedString.replace(CONFIG.REGEX.FRAGMENT, insert);

  logDebug("Fragment listener insertion:", result.includes(insert) ? "successful" : "failed");

  return result;
}

function removeFragmentListener(matches, decodedString) {
  const insert = createPromiseWrapper(matches);
  const originalCode = `${matches[1]}.messageProcessor.processMessage(${matches[2]}.data)`;

  if (decodedString.includes(insert)) {
    logDebug("Removing existing mixin");
    const result = decodedString.replace(insert, originalCode);
    logDebug("Mixin removal:", result.includes(insert) ? "failed" : "successful");
    return result;
  }

  return decodedString;
}

function createPromiseWrapper(matches) {
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
    } else {
      console.warn('removed message:', ${matches[2]}.data);
    }
  });`;
}

function processDecodedStringVendor(decodedString) {
  const matches = CONFIG.REGEX.FRAGMENT.exec(decodedString);

  if (matches?.length === 3) {
    logDebug("Found Fragment Location:", matches);
    decodedString = STATE.enabled ? insertFragmentListener(matches, decodedString) : removeFragmentListener(matches, decodedString);
  }

  if (STATE.enabled) {
    logDebug("Encrypted Media Allowed: ", STATE.supervisorEM === false);
    STATE.supervisorEM === true && (decodedString = decodedString.replace('n.setAttribute("allow","encrypted-media *"),', ""));
  }

  return decodedString;
}

function checkJS(details) {
  if (STATE.enabled) {
    loadOptions();
    STATE.fragments = getFragments();
    logDebug(`Fragments: ${STATE.fragments.length || 'No rules found in settings'}`);
  }

  const data = [];
  const filter = browser.webRequest.filterResponseData(details.requestId);
  const decoder = new TextDecoder(CONFIG.ENCODING);
  const encoder = new TextEncoder();

  filter.ondata = event => data.push(event.data);

  filter.onstop = () => {
    try {
      const decodedString = decodeData(data, decoder);
      const processedString = processDecodedStringVendor(decodedString);

      filter.write(encoder.encode(processedString));
    } catch (error) {
      logError('Error processing request:', error);
    } finally {
      filter.close();
    }
  };

}

function checkGQL(details) {
  const data = [];
  const filter = browser.webRequest.filterResponseData(details.requestId);
  const decoder = new TextDecoder(CONFIG.ENCODING);
  const encoder = new TextEncoder();

  filter.ondata = event => data.push(event.data);

  filter.onstop = () => {
    let str = decodeData(data, decoder);

    if (str.includes(',"recentChatMessages":[{"id":')) {
      let obj = JSON.parse(str);

      for (let index = 0; index < obj.length; index++) {
        const element = obj[index];
        if (element.extensions.operationName === "MessageBufferChatHistory") {
          element.data.channel.recentChatMessages = element.data.channel.recentChatMessages.filter(item => {
            return !STATE.fragments.some(text => text != "" && (item.sender.displayName.includes(text) || item.content.text.includes(text) || definedContentRules(text, item)));
          });
          break;
        }
      }

      str = JSON.stringify(obj);
    }

    filter.write(encoder.encode(str));

    filter.close();
  }
}

loadOptions();

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!isValidSender(sender)) {
    logDebug("Invalid message:", message, sender);
    return;
  }

  const handlers = {
    checkDebugSettingRequest: () => ({ debugEnabled: loadOptions(), extensionEnabled: STATE.enabled }),
    requestForFragments: () => ({ fragments: getFragments(), completed: true }),
    sendRequestForFragments: () => broadcastToTwitchTabs({ requestFragments: true }),
    sendRequestForSettings: () => broadcastToTwitchTabs({ requestSettings: true })
  };

  const handler = Object.keys(handlers).find(key => message[key] !== undefined);
  if (handler) {
    const response = handlers[handler]();
    if (response) sendResponse(response);
  }
});

browser.webRequest.onBeforeRequest.addListener((details) => {
  if (details.url.endsWith(CONFIG.JS_EXT) && CONFIG.REGEX.VENDOR.test(details.url)) {
    return checkJS(details);
  }

  if (details.url.startsWith("https://gql")) {
    return checkGQL(details);
  }
}, { urls: ["https://*.twitch.tv/*"] }, ["blocking", "requestBody"]);

browser.browserAction.onClicked.addListener(() => {
  STATE.enabled = !STATE.enabled;

  console.log("Extension enabled:", STATE.enabled);

  browser.browserAction.setIcon({
    path: {
      256: STATE.enabled ? "icons/icon-e.png" : "icons/icon-d.png"
    }
  });

  broadcastToTwitchTabsCallback(tab => reloadTab(tab));
});