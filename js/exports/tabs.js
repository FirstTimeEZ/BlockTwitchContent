import { logDebug, logError } from "./exports.js";

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

export const sendMessageToTab = (tab, message) => browser.tabs.sendMessage(tab.id, message).catch(error => logError("Tab message failed:", error));

export const isTwitchTab = tab => tab.url.includes("twitch.tv") && !tab.url.includes("supervisor");