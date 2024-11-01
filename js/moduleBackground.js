import { CONFIG, STATE } from "./exports/exports.js";
import { loadOptions, getFragments } from "./exports/exports.js";
import { decodeData, isValidSender, logDebug } from "./exports/exports.js";
import { broadcastToTwitchTabs, broadcastToTwitchTabsCallback, reloadTab } from "./exports/tabs.js";
import { definedContentRules } from "./exports/content-rules.js";
import { insertFragmentListener, removeFragmentListener } from "./exports/fragments.js";

function checkVendor(details) {
  const data = [];
  const filter = browser.webRequest.filterResponseData(details.requestId);
  const decoder = new TextDecoder(CONFIG.ENCODING);
  const encoder = new TextEncoder();

  filter.ondata = event => data.push(event.data);

  filter.onstop = () => {
    let decodedString = decodeData(data, decoder);

    const matches = CONFIG.REGEX.FRAGMENT.exec(decodedString);
    if (matches?.length === 3) {
      logDebug("Found Fragment Location:", matches);
      decodedString = STATE.enabled ? insertFragmentListener(matches, decodedString) : removeFragmentListener(matches, decodedString);
    }

    if (STATE.enabled) {
      logDebug("Encrypted Media Allowed: ", STATE.supervisorEM === false);
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
  const decoder = new TextDecoder(CONFIG.ENCODING);
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
  if (STATE.enabled && details.type == "main_frame") {
    loadOptions();
    STATE.fragments = getFragments();
    console.log(`Content rules loaded: ${STATE.fragments.length || 'No content rules found'}`);
    return {};
  }

  if (details.url.endsWith(CONFIG.JS_EXT) && CONFIG.REGEX.VENDOR.test(details.url)) {
    return checkVendor(details);
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