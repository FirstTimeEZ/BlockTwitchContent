import { CONFIG, C } from "./exports/constants.js";
import { STATE } from "./exports/state.js";
import { getStorageItemStates } from "./exports/storage.js";
import { definedContentRules } from "./exports/content-rules.js";
import { decodeData, isValidSender, logDebug } from "./exports/util.js";
import { insertFragmentListener, removeFragmentListener } from "./exports/fragments.js";
import { broadcastToTwitchTabs, broadcastToTwitchTabsCallback, reloadTab } from "./exports/tabs.js";

const requestHandlers = {
  requestForState: () => getStorageItemStates(),
  requestForStateUpdate: () => { getStorageItemStates(); broadcastToTwitchTabs({ refreshState: true }); }
};

function checkVendor(details) {
  const data = [];
  const filter = browser.webRequest.filterResponseData(details.requestId);
  const decoder = new TextDecoder(C.UTF_8);
  const encoder = new TextEncoder();

  filter.ondata = event => data.push(event.data);

  filter.onstop = () => {
    let decodedString = decodeData(data, decoder);

    const matches = CONFIG.REGEX.FRAGMENT.exec(decodedString);
    if (matches?.length === 3) {
      logDebug("backgroundModule::foundFragmentLocation", matches);
      decodedString = STATE.enabled ? insertFragmentListener(matches, decodedString) : removeFragmentListener(matches, decodedString);
    }

    if (STATE.enabled) {
      logDebug("backgroundModule::encryptedMediaAllowed", STATE.supervisorEM === false);
      STATE.supervisorEM === true && (decodedString = decodedString.replace('n.setAttribute("allow","encrypted-media *"),', ""));
    }

    filter.write(encoder.encode(decodedString));
    filter.close();
    data.length = 0;
  };
}

function checkGQL(details) {
  const data = [];
  const filter = browser.webRequest.filterResponseData(details.requestId);
  const decoder = new TextDecoder(C.UTF_8);
  const encoder = new TextEncoder();

  filter.ondata = event => data.push(event.data);

  filter.onstop = () => {
    let decodedString = decodeData(data, decoder);

    if (decodedString.includes(',"recentChatMessages":[{"id":')) {
      let json = JSON.parse(decodedString);

      for (let index = 0; index < json.length; index++) {
        const element = json[index];
        if (element.extensions.operationName === "MessageBufferChatHistory") {
          element.data.channel.recentChatMessages = element.data.channel.recentChatMessages.filter(chatMessage =>
            !STATE.fragments.some(fragment => fragment.length > 1
              && (chatMessage.sender.displayName.includes(fragment)
                || chatMessage.content.text.includes(fragment)
                || definedContentRules(fragment, chatMessage))));
          break;
        }
      }

      decodedString = JSON.stringify(json);
    }

    filter.write(encoder.encode(decodedString));
    filter.close();
    data.length = 0;
  }
}

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (isValidSender(sender)) {
    const handlerFound = Object.keys(requestHandlers).find(key => message[key] !== undefined);

    if (handlerFound) {
      const requestHandledWithResponse = requestHandlers[handlerFound]();

      requestHandledWithResponse && sendResponse(requestHandledWithResponse);
    }
    else {
      logDebug("backgroundModule::validSenderUnknownMessage", sender, message);
    }
  } else {
    logDebug("backgroundModule::invalidMessage", sender);
  }
});

browser.webRequest.onBeforeRequest.addListener((details) => {
  if (STATE.enabled && details.type == "main_frame") {
    getStorageItemStates();
    console.log(`backgroundModule::` + (STATE.fragments.length > 0 ? `contentRulesLoaded` : 'contentRulesNotFound'), STATE.fragments.length);
    return {};
  }

  if (details.url.endsWith(C.JS_EXT) && CONFIG.REGEX.VENDOR.test(details.url)) {
    return checkVendor(details);
  }

  if (details.url.startsWith("https://gql")) {
    return checkGQL(details);
  }
}, { urls: ["https://*.twitch.tv/*"] }, ["blocking", "requestBody"]);

browser.browserAction.onClicked.addListener(() => {
  STATE.enabled = !STATE.enabled;

  console.log("backgroundModule::extensionEnabled", STATE.enabled);

  browser.browserAction.setIcon({
    path: {
      256: STATE.enabled ? "icons/icon-e.png" : "icons/icon-d.png"
    }
  });

  broadcastToTwitchTabsCallback(tab => reloadTab(tab));
});