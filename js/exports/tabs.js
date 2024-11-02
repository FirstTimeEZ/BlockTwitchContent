import { logDebug, logError } from "./util.js";

export const broadcastToTwitchTabs = (message) => {
  try {
    browser.tabs.query({}).then((tabs) => {
      tabs.forEach(tab => {
        if (isTwitchTab(tab)) {
          logDebug("tabs::broadcastToTwitchTabs", message);
          sendMessageToTab(tab, message);
        }
      });
    });
  } catch (error) {
    logError("tabs::errorBroadcasting", error);
  }
}

export const broadcastToTwitchTabsCallback = (callback) => {
  try {
    browser.tabs.query({}).then((e) => e.forEach(tab => isTwitchTab(tab) && callback(tab)), (e) => { logDebug(e) });
  } catch (error) {
    logError("tabs::errorBroadcasting", error);
  }
}

export const reloadTab = (tab) => {
  try {
    browser.tabs.reload(tab.id, { bypassCache: true });
    logDebug("tabs::reloadedSuccessfully");
  } catch (error) {
    logError("tabs::reloadFailedUseFallback", error);
    sendMessageToTab(tab, { refreshPageRequest: true });
  }
}

export const sendMessageToTab = (tab, message) => browser.tabs.sendMessage(tab.id, message).catch(error => logError("tabs::errorBroadcasting", error));

export const isTwitchTab = tab => tab.url.includes("twitch.tv") && !tab.url.includes("supervisor");