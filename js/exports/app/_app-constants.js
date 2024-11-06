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
    EXTRAS: "chatExtras"
  },
  REGEX: {
    FRAGMENT: /([A-Za-z])\.messageProcessor\.processMessage\(([A-Za-z])\.data\)/,
    VENDOR: /assets\/vendor-[0-9a-z]+?\.js/i,
    CHAT_SHELL: /assets\/pages.channel.components.channel-shell.components.chat-shell.components.chat-live-[0-9a-z]+?\.js/i,
    CHAT_ACTION_SUFFIX: /([A-Za-z0-9_]+?)\.([A-Za-z0-9_]+?)\.ModerationAction:return/,
  },
  HISTORY: {
    MAX: 225,
    RETAIN: 50,
    RENDER_MS: 750,
    UPDATE_MS: 1000
  },
  DEBOUNCE_MS: 750,
  IMAGES: {
    SPINNER: "/icons/waiting.gif"
  }
};

export const C = {
  AT: "@",
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

export const HTML = {
  DIV: "div",
  IMG: "img",
  LABEL: "label",
  INPUT: "input",
  H1: "h1",
  PARAGRAPH: "p",
  SPAN: "span"
}

export const TYPES = {
  TEXT: "text",
  CHECKBOX: "checkbox",
  BUTTON: "button"
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

export const CSS = {
  CARD_DETAIL: "card-icon-detail",
  CARD_DETAIL_LIST: "details-list",
  CARD_DETAIL_ITEM: "detail-item",
  TITLE: "title",
  TAB: "tab",
  TABS: "tabs",
  TAB_CONTENT: "tab-content",
  TAB_CONTAINER: "tab-container",
  EMPTY_STATE: "empty-state",
  TOGGLE_BUTTON: "toggle-button",
  CONTAINER_FLEX: "container-flex",
  SPINNER: "waitingSmall",
  MESSAGES: "messages",
  MESSAGE_CARD: "message-card",
  MESSAGE_CONTENT: "message-content",
  BASE_CONTAINER: "container containerRem",
}

export const STYLE = {
  FLEX: "flex",
  NONE: "none"
}

export const CM = {
  COMMENT: "PRIVMSG",
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

export const MV = {
  HEADING: "Message History for ",
  EMPTY_STATE_MESSAGE: `New messages will be added automatically above, Old messages appear below.
  If there are no messages, nothing has been blocked, You can wait or come back later.`,
}

export const ICON = {
  ENABLED: "icons/icon-e.png",
  DISABLED: "icons/icon-d.png"
}

export const COMMON_BOTS = [
  "display-name=StreamElements",
  "display-name=Streamlabs",
  "display-name=SoundAlerts",
  "display-name=Moobot",
  "display-name=Nightbot",
  "display-name=Fossabot",
  "display-name=DeepBot",
  "display-name=WizeBot",
  "display-name=PhantomBot",
  "display-name=Botisimo",
  "display-name=TwitchBot"
];

export const COMMON_COMMANDS = [
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
  "!height",
  "!weight",
  "!donate",
  "!schedule",
  "!vote",
  "!specs",
  "!sens",
  "!party",
  "!song",
  "!playing",
  "!game",
  "!music",
  "!patch",
  "!event"
];

export const COMMON_COMMANDS_S = [
  ":!join",
  ":!gamble",
  ":!following",
  ":!followage",
  ":!links",
  ":!points",
  ":!hype",
  ":!uptime",
  ":!commands",
  ":!watchtime",
  ":!socials",
  ":!height",
  ":!weight",
  ":!donate",
  ":!schedule",
  ":!vote",
  ":!specs",
  ":!sens",
  ":!party",
  ":!song",
  ":!playing",
  ":!game",
  ":!music",
  ":!patch",
  ":!event"
];

export const BLOCKED_CHATTER_TYPES = [
  "AutoMod",
  "Moderation",
  "ModerationAction",
  "TargetedModerationAction",
  "Notice",
  "Info",
  "InlinePrivateCallout",
  "Raid",
  "Unraid",
  "ExtensionMessage",
  "ChannelPointsReward",
  "CommunityChallengeContribution",
  "Shoutout",
  "ViewerMilestone",
  "AnnouncementMessage",
  "Resubscription",
  "ExtendSubscription",
  "PrimePaidUpgrade",
  "PrimeCommunityGiftReceivedEvent",
  "RestrictedLowTrustUserMessage",
  "AnonGiftPaidUpgrade",
  "AnonSubMysteryGift",
  "AnonSubGift",
  "GiftPaidUpgrade",
  "BitsCharity",
  "RewardGift",
  "StandardPayForward",
  "CommunityPayForward",
  "SubMysteryGift",
  "SubGift",
  "CharityDonation",
  "Subscription",
  "BitsBadgeTierMessage",
  "FirstCheerMessage"
];