const CONFIG = {
  SENDER_UUID: "BlockContent@Twitch.tv",
  SCRIPTS: {
    CONTENT: "content_child",
    OPTIONS: "addon_child"
  },
  SETTINGS: {
    FRAGMENTS: "fragments",
    DEBUG: "debugEnabled",
    ENCRYPTED_MEDIA: "encryptedMedia"
  },
  REGEX: {
    FRAGMENT: /([A-Za-z])\.messageProcessor\.processMessage\(([A-Za-z])\.data\)/,
    VENDOR: /https:\/\/assets\.twitch\.tv\/assets\/vendor-[0-9a-z]+?\.js/i
  },
  ENCODING: "utf-8",
  JS_EXT: ".js",
};

const STATE = {
  fragments: [],
  enabled: true,
  debug: false,
  supervisorEM: false
};

function loadOptions() {
  const debugSetting = window.localStorage.getItem(CONFIG.SETTINGS.DEBUG);
  const encryptedMedia = window.localStorage.getItem(CONFIG.SETTINGS.ENCRYPTED_MEDIA);

  encryptedMedia === null ? (window.localStorage.setItem(CONFIG.SETTINGS.ENCRYPTED_MEDIA, "true"), STATE.supervisorEM = true) : (STATE.supervisorEM = encryptedMedia === "true");

  return (STATE.debug = debugSetting === "true");
}

function getFragments() {
  const fragments = window.localStorage.getItem(CONFIG.SETTINGS.FRAGMENTS);

  if (fragments !== null) {
    STATE.fragments = fragments ? fragments.split("\n") : [];
  }

  return STATE.fragments;
}

function processDecodedString(decodedString) {
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

const broadcastToTwitchTabs = (message) => {
  try {
    browser.tabs.query({}).then((tabs) => {
      tabs.forEach(tab => {
        if (isTwitchTab(tab)) {
          logDebug(tab, message);
          sendMessageToTab(tab, message);
        }
      });
    });
  } catch (error) {
    logError("Error broadcasting to tabs:", error);
  }
}

const broadcastToTwitchTabsCallback = (callback) => {
  try {
    browser.tabs.query({}).then((e) => e.forEach(tab => isTwitchTab(tab) && callback(tab)), (e) => { logDebug(e) });
  } catch (error) {
    logError("Error broadcasting to tabs:", error);
  }
}

const reloadTab = (tab) => {
  try {
    browser.tabs.reload(tab.id, { bypassCache: true });
    logDebug("Tab reloaded successfully");
  } catch (error) {
    logError("Tab reload failed, falling back to content script", error);
    sendMessageToTab(tab, { refreshPageRequest: true });
  }
}

const decodeData = (data, decoder) => data.length === 1 ? decoder.decode(data[0]) : data.reduce((acc, chunk, index) => { const stream = index !== data.length - 1; return acc + decoder.decode(chunk, { stream }); }, '')

const isValidSender = sender => sender.id === CONFIG.SENDER_UUID && (sender.envType === CONFIG.SCRIPTS.CONTENT || sender.envType === CONFIG.SCRIPTS.OPTIONS);

const isTwitchTab = tab => tab.url.includes("twitch.tv") && !tab.url.includes("supervisor");

const sendMessageToTab = (tab, message) => browser.tabs.sendMessage(tab.id, message).catch(error => logError("Tab message failed:", error));

const logDebug = (...args) => STATE.debug && console.log(...args);

const logError = (...args) => console.error(...args);

// Initialize Extension
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
  if (!details.url.endsWith(CONFIG.JS_EXT) || !CONFIG.REGEX.VENDOR.test(details.url)) {
    return;
  }

  const filter = browser.webRequest.filterResponseData(details.requestId);
  const data = [];

  if (STATE.enabled) {
    loadOptions();
    STATE.fragments = getFragments();
    logDebug(`Fragments: ${STATE.fragments.length || 'No rules found in settings'}`);
  }

  const decoder = new TextDecoder(CONFIG.ENCODING);
  const encoder = new TextEncoder();

  filter.ondata = event => data.push(event.data);

  filter.onstop = () => {
    try {
      const decodedString = decodeData(data, decoder);
      const processedString = processDecodedString(decodedString);

      filter.write(encoder.encode(processedString));
    } catch (error) {
      logError('Error processing request:', error);
    } finally {
      filter.close();
    }
  };
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