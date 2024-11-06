import { STATE } from "./exports/app/state.js";
import { CONFIG, C, URI, ICON, COMMON_BOTS, COMMON_COMMANDS, BLOCKED_CHATTER_TYPES } from "./exports/app/_app-constants.js";
import { getStorageItemStates } from "./exports/app/storage.js";
import { definedContentRules } from "./exports/app/content-rules.js";
import { decodeData, isValidSender, logDebug } from "./exports/app/util.js";
import { insertFragmentListener, removeFragmentListener } from "./exports/app/fragments.js";
import { broadcastToTwitchTabs, broadcastToTwitchTabsCallback, reloadTab } from "./exports/app/tabs.js";

const requestHandlers = {
  requestForState: () => getStorageItemStates(),
  requestForStateUpdate: () => { getStorageItemStates(); broadcastToTwitchTabs({ refreshState: true }); },
  requestForSettingsTab: () => {
    browser.tabs.create({
      url: browser.runtime.getURL("") + "view.html"
    });
  }
};

function checkChatShell(details) {
  const data = [];
  const filter = browser.webRequest.filterResponseData(details.requestId);
  const decoder = new TextDecoder(C.UTF_8);
  const encoder = new TextEncoder();

  filter.ondata = event => data.push(event.data);

  filter.onstop = () => {
    let decodedString = decodeData(data, decoder);

    const suffix = CONFIG.REGEX.CHAT_ACTION_SUFFIX.exec(decodedString);

    if (suffix.length > 1) {
      for (let index = 0; index < BLOCKED_CHATTER_TYPES.length; index++) {
        const m = `${suffix[1]}.${suffix[2]}.${BLOCKED_CHATTER_TYPES[index]}:return`;
        const n = `${suffix[1]}.${suffix[2]}.${BLOCKED_CHATTER_TYPES[index]}:{};return null;return`;

        if (STATE.enabled && STATE.disableChatExtras) {
          decodedString = decodedString.replace(m, n);
        }
        else {
          decodedString = decodedString.replace(n, m);
        }
      }
    }

    filter.write(encoder.encode(decodedString));
    filter.close();
    data.length = 0;
  };
}

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
      logDebug("backgroundModule::encryptedMediaAllowed", STATE.disableEncryptedMedia === false);
      STATE.disableEncryptedMedia === true && (decodedString = decodedString.replace('n.setAttribute("allow","encrypted-media *"),', C.EMPTY));
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
          element.data.channel.recentChatMessages = element.data.channel.recentChatMessages.filter(chatMessage => {

            if (STATE.fragments.some(fragment => fragment.length > 1 && (chatMessage.sender.displayName.includes(fragment) || chatMessage.content.text.includes(fragment) || definedContentRules(fragment, chatMessage)))) {
              return false;
            }

            if (STATE.hideBots) {
              if (COMMON_BOTS.some(fragment => fragment.length > 1 && (chatMessage.sender.displayName.includes(fragment) || chatMessage.content.text.includes(fragment) || definedContentRules(fragment, chatMessage)))) {
                return false;
              }
            }

            if (STATE.hideCommands) {
              if (COMMON_COMMANDS.some(fragment => fragment.length > 1 && (chatMessage.sender.displayName.includes(fragment) || chatMessage.content.text.includes(fragment) || definedContentRules(fragment, chatMessage)))) {
                return false;
              }
            }

            return true;
          });
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
      const requestHandledWithResponse = requestHandlers[handlerFound](message);

      requestHandledWithResponse && sendResponse(requestHandledWithResponse);
    }
    else {
      if (message.pastMessagesReply || message.streamChangedReply) {
        return;
      }

      logDebug("backgroundModule::validSenderUnknownMessage", sender, message);
    }
  } else {
    logDebug("backgroundModule::invalidMessage", sender);
  }
});

browser.webRequest.onBeforeRequest.addListener((details) => {
  if (STATE.enabled && details.type == C.MAIN) {
    getStorageItemStates();
    console.log(`backgroundModule::` + (STATE.fragments.length > 0 ? `contentRulesLoaded` : 'contentRulesNotFound'), STATE.fragments.length);
    return {};
  }

  if (details.url.endsWith(C.JS_EXT)) {
    if (CONFIG.REGEX.VENDOR.test(details.url)) {
      return checkVendor(details);
    }

    if (CONFIG.REGEX.CHAT_SHELL.test(details.url)) {
      return checkChatShell(details);
    }

    return {};
  }

  if (details.url.startsWith(URI.TWITCH_GQL)) {
    return checkGQL(details);
  }
}, { urls: [URI.TWITCH_WC] }, [URI.BLOCKING, URI.REQUEST_BODY]);

browser.browserAction.onClicked.addListener(() => {
  STATE.enabled = !STATE.enabled;

  console.log("backgroundModule::extensionEnabled", STATE.enabled);

  browser.browserAction.setIcon({
    path: {
      256: STATE.enabled ? ICON.ENABLED : ICON.DISABLED
    }
  });

  broadcastToTwitchTabsCallback(tab => reloadTab(tab));
});