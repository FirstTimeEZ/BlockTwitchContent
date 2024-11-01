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
    VENDOR: /assets\/vendor-[0-9a-z]+?\.js/i
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

export const decodeData = (data, decoder) => data.length === 1 ? decoder.decode(data[0]) : data.reduce((acc, chunk, index) => { const stream = index !== data.length - 1; return acc + decoder.decode(chunk, { stream }); }, '')

export const isValidSender = sender => sender.id === CONFIG.SENDER_UUID && (sender.envType === CONFIG.SCRIPTS.CONTENT || sender.envType === CONFIG.SCRIPTS.OPTIONS);

export const logDebug = (...args) => STATE.debug && console.log(...args);

export const logError = (...args) => console.error(...args);