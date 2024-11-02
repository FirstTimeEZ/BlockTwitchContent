export const CONFIG = {
  SENDER_UUID: "BlockContent@Twitch.tv",
  SCRIPTS: {
    CONTENT: "content_child",
    OPTIONS: "addon_child"
  },
  SETTINGS: {
    FRAGMENTS: "fragments",
    DEBUG: "debugEnabled",
    ENCRYPTED_MEDIA: "encryptedMedia",
    HIDE_BOTS: "hideBots",
    HIDE_COMMANDS: "hideCommands",
  },
  REGEX: {
    FRAGMENT: /([A-Za-z])\.messageProcessor\.processMessage\(([A-Za-z])\.data\)/,
    VENDOR: /assets\/vendor-[0-9a-z]+?\.js/i
  },
  DEBOUNCE_MS: 750,
};

export const commonBots = [
  "display-name=StreamElements",
  "display-name=Streamlabs",
  "display-name=SoundAlerts",
  "display-name=Moobot",
  "display-name=Nightbot",
  "display-name=Fossabot",
  "display-name=DeepBot",
  "display-name=WizeBot",
  "display-name=PhantomBot",
  "display-name=Streamlabs Chatbot",
  "display-name=Botisimo",
  "display-name=TwitchBot"
];

export const commonCommands = [
  "!join",
  "!gamble",
  "!following",
  "!followage",
  "!links",
  "!points",
  "!hype",
  "!uptime",
  "!commands",
  "!watchtime",
  "!socials",
  "!donate",
  "!schedule",
  "!vote"
];

export const C = {
  EQUALS: "=",
  EMPTY: "",
  TRUE: "true",
  NEW_LINE: "\n",
  NUMBER: "number",
  STRING: "string",
  UTF_8: "utf-8",
  JS_EXT: ".js",
  MAIN: "main_frame",
  PX: "px",
}

export const CM = {
  FRAG_P: "fp",
  FRAG_F: "f",
  FRAG_W: "w",
  CONTENT: "contentModule",
  LOADED: "contentModule::Loaded",
  REFRESH: "contentModule::refreshPageRequest",
  UNKNOWN: "contentModule::unknownMessage",
  INVALID: "contentModule::invalidMessage",
  MIXIN: "contentModule::mixinMessage",
}

export const URI = {
  TWITCH: "https://www.twitch.tv/",
  TWITCH_WC: "https://*.twitch.tv/*",
  TWITCH_GQL: "https://gql.twitch.tv/",
  BLOCKING: "blocking",
  REQUEST_BODY: "requestBody",
}

export const CR = {
  USER_TYPE: "user-type=",
  USER_ID: "user-id=",
  USER_DISPLAY_NAME: "display-name=",
}

export const PM = {
  POPUP: "popupModule",
  DESTROYED: "popupModule::domDestroyed",
}

export const ICON = {
  ENABLED: "icons/icon-e.png",
  DISABLED: "icons/icon-d.png"
}

export const UI = {
  CLICK: "click",
  INPUT: "input",
  ACTIVE: "active",
  MESSAGE: "message",
  UNLOAD: "unload",
  MOUSE_DOWN: "mousedown",
  MOUSE_UP: "mouseup",
  DOM_LOADED: "DOMContentLoaded",
  STYLE: "style",
}