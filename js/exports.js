export const CONFIG = {
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

export const STATE = {
  fragments: [],
  enabled: true,
  debug: false,
  supervisorEM: false
};

export function debounceEvent(func, delay) {
  let timeoutId;
  return function (...args) {
    timeoutId && clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

export function loadOptions() {
  const debugSetting = window.localStorage.getItem(CONFIG.SETTINGS.DEBUG);
  const encryptedMedia = window.localStorage.getItem(CONFIG.SETTINGS.ENCRYPTED_MEDIA);

  encryptedMedia === null ? (window.localStorage.setItem(CONFIG.SETTINGS.ENCRYPTED_MEDIA, "true"), STATE.supervisorEM = true) : (STATE.supervisorEM = encryptedMedia === "true");

  return (STATE.debug = debugSetting === "true");
}

export function getFragments() {
  const fragments = window.localStorage.getItem(CONFIG.SETTINGS.FRAGMENTS);

  if (fragments !== null) {
    STATE.fragments = fragments ? fragments.split("\n") : [];
  }

  return STATE.fragments;
}

export function RequestSettings(who, func) {
  browser.runtime.sendMessage({ checkDebugSettingRequest: true },
    (response) => {
      if (response != undefined) {
        console.log(who, response);
        STATE.debug = response.debugEnabled;
        STATE.enabled = response.extensionEnabled;
        func != undefined ? func() : null;
      }
    });
}

export function RequestFragments() {
  browser.runtime.sendMessage({ requestForFragments: true },
    (response) => {
      if (response.fragments != undefined) {
        STATE.fragments = response.fragments;
        logDebug("Updated fragments", response);
      }
    });
}

export const broadcastToTwitchTabs = (message) => {
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

export const broadcastToTwitchTabsCallback = (callback) => {
  try {
    browser.tabs.query({}).then((e) => e.forEach(tab => isTwitchTab(tab) && callback(tab)), (e) => { logDebug(e) });
  } catch (error) {
    logError("Error broadcasting to tabs:", error);
  }
}

export const reloadTab = (tab) => {
  try {
    browser.tabs.reload(tab.id, { bypassCache: true });
    logDebug("Tab reloaded successfully");
  } catch (error) {
    logError("Tab reload failed, falling back to content script", error);
    sendMessageToTab(tab, { refreshPageRequest: true });
  }
}

export const decodeData = (data, decoder) => data.length === 1 ? decoder.decode(data[0]) : data.reduce((acc, chunk, index) => { const stream = index !== data.length - 1; return acc + decoder.decode(chunk, { stream }); }, '')

export const isValidSender = sender => sender.id === CONFIG.SENDER_UUID && (sender.envType === CONFIG.SCRIPTS.CONTENT || sender.envType === CONFIG.SCRIPTS.OPTIONS);

export const isTwitchTab = tab => tab.url.includes("twitch.tv") && !tab.url.includes("supervisor");

export const sendMessageToTab = (tab, message) => browser.tabs.sendMessage(tab.id, message).catch(error => logError("Tab message failed:", error));

export const logDebug = (...args) => STATE.debug && console.log(...args);

export const logError = (...args) => console.error(...args);