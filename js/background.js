const SENDER_UUID = "BlockContent@Twitch.tv";
const CONTENT_SCRIPT = "content_child";
const OPTIONS_SCRIPT = "addon_child";

const JS_ONLY = ".js";
const UTF_8 = "utf-8";

const FRAGMENT_STORAGE_NAME = "fragments";
const DEBUG_SETTING = "debugEnabled";
const ENCRYPTED_MEDIA_SETTING = "encryptedMedia";

var FIND_FRAGMENT_REGEX = /([A-Za-z])\.messageProcessor\.processMessage\(([A-Za-z])\.data\)/;
var FIND_VENDOR_REGEX = /https:\/\/assets\.twitch\.tv\/assets\/vendor-[0-9a-z]+?\.js/i;

var fragsSplit = [];

var enabled = true;
var shouldDebug = false;
var supervisorEM = false;

LoadOptions();

browser.runtime.onMessage.addListener((message, sender, sendResponse) => { // Listen for Messages from the Content Script / Options Page / PopupWorker
  if (sender.id == SENDER_UUID && (sender.envType == CONTENT_SCRIPT || sender.envType == OPTIONS_SCRIPT)) {
    if (message.checkDebugSettingRequest != undefined) {
      LoadOptions();
      sendResponse({ debugEnabled: shouldDebug }); // BackgroundWorker -> Content Script
    }
    else if (message.requestForFragments != undefined) {
      sendResponse({ fragments: GetFragments(), completed: true }); // BackgroundWorker -> Content Script
    }
    else if (message.sendRequestForFragments != undefined) {
      TwitchTabsQueryAll((tab) => TabSendMessage(tab, { requestFragments: true })); // BackgroundWorker -> All Twitch Tabs
    }
    else if (message.sendRequestForDebug != undefined) {
      TwitchTabsQueryAll((tab) => TabSendMessage(tab, { requestDebug: true })); // BackgroundWorker -> All Twitch Tabs
    }
  }
  else {
    shouldDebug && console.log(message, sender);
  }
});

browser.webRequest.onBeforeRequest.addListener((details) => { // Twitch Request Response Body Listener
  if (details.url.endsWith(JS_ONLY) && FIND_VENDOR_REGEX.exec(details.url) != undefined) {
    let filter = browser.webRequest.filterResponseData(details.requestId);
    let decoder = new TextDecoder(UTF_8);
    let encoder = new TextEncoder();
    let data = [];

    if (enabled) {
      LoadOptions();
      fragsSplit = GetFragments();
      console.log("Fragments: " + (fragsSplit.length > 0 ? fragsSplit.length : "You need to add a rule in the settings, nothing to remove from chat"));
    }

    shouldDebug && console.log(details.url);

    filter.ondata = (event) => {
      data.push(event.data);
    };

    filter.onstop = () => {
      let decodedString = "";
      if (data.length === 1) {
        decodedString = decoder.decode(data[0]);
      } else {
        for (let i = 0; i < data.length; i++) {
          let stream = i !== data.length - 1;
          decodedString += decoder.decode(data[i], {
            stream
          });
        }
      }

      var matches = FIND_FRAGMENT_REGEX.exec(decodedString);
      if (matches != undefined && matches.length == 3) {
        shouldDebug && console.log("Found Fragment Location: " + FIND_FRAGMENT_REGEX, matches);
        decodedString = enabled ? InsertFragmentListener(matches, decodedString) : RemoveFragmentListener(matches, decodedString);
      }

      if (!supervisorEM && enabled) {
        shouldDebug && console.log("No Encrypted Media");
        decodedString = decodedString.replace('n.setAttribute("allow","encrypted-media *"),', "");
      }

      filter.write(encoder.encode(decodedString));
      filter.close();

      data = null;
      decoder = null;
      encoder = null;
    }

    str = null;
  }
}, { urls: ["https://*.twitch.tv/*"] }, ["blocking", "requestBody"]);

browser.browserAction.onClicked.addListener(() => { // Browser Action Button
  enabled = !enabled;

  shouldDebug && console.log("enabled: ", enabled);

  browser.browserAction.setIcon({
    path: enabled ? {
      256: "icons/icon-e.png"
    } : {
      256: "icons/icon-d.png"
    },
  });

  TwitchTabsQueryAll((tab) => ReloadTab(tab));
});

const TwitchTabsQueryAll = (callback) => {
  browser.tabs.query({}).then((e) => {
    e.forEach(tab => {
      if (tab.url.includes("twitch.tv") && !tab.url.includes("supervisor")) {
        callback(tab);
      }
    });
  }, (e) => { console.log(e) });
}

const ReloadTab = (tab) => {
  browser.tabs.reload(tab.id, { bypassCache: true }).then(() => { // BackgroundWorker -> All Twitch Tabs
    shouldDebug && console.log("page refresh triggered by tabs")
  }, (error) => {
    console.error("tabs did not refresh the page, fallback to content script", error);
    TabSendMessage(tab, { refreshPageRequest: true }); // BackgroundWorker -> All Twitch Tabs Content Script
  });
}

const TabSendMessage = (tab, message) => {
  browser.tabs.sendMessage(tab.id, message).catch((error) => {
    console.error(error);
  });
}

function LoadOptions() {
  var debugSetting = window.localStorage.getItem(DEBUG_SETTING);
  var encryptedMedia = window.localStorage.getItem(ENCRYPTED_MEDIA_SETTING);

  shouldDebug = debugSetting !== null ? debugSetting == "true" : false;
  encryptedMedia !== null ? (supervisorEM = encryptedMedia == "false") : window.localStorage.setItem(ENCRYPTED_MEDIA_SETTING, true);
}

function GetFragments() {
  var fragments = window.localStorage.getItem(FRAGMENT_STORAGE_NAME);
  return fragments !== null ? fragments.split("\n") : [];
}

function InsertFragmentListener(matches, decodedString) {
  var INSERT = "new Promise((resolve) => { const val = Math.floor(Math.random() * 100000000); const handler = (e2) => { if (e2.data.response != undefined && e2.data.completed && e2.data.random == val) { resolve(e2.data.response); window.removeEventListener('message', handler); } }; window.addEventListener('message', handler); window.postMessage({ random: val, type: 'fp', text: " + matches[2] + ".data }); }, 'https://www.twitch.tv').then(response => { if(response == 'w'){ " + matches[1] + ".messageProcessor.processMessage(" + matches[2] + ".data) } else { console.warn('removed message:', " + matches[2] + ".data); }});";

  decodedString = decodedString.replace(FIND_FRAGMENT_REGEX, INSERT);
  shouldDebug && decodedString.search(INSERT) != -1 && console.log("Inserted Promise Event Listener into page to handle socket messages");

  return decodedString;
}

function RemoveFragmentListener(matches, decodedString) {
  var INSERT = "new Promise((resolve) => { const val = Math.floor(Math.random() * 100000000); const handler = (e2) => { if (e2.data.response != undefined && e2.data.completed && e2.data.random == val) { resolve(e2.data.response); window.removeEventListener('message', handler); } }; window.addEventListener('message', handler); window.postMessage({ random: val, type: 'fp', text: " + matches[2] + ".data }); }, 'https://www.twitch.tv').then(response => { if(response == 'w'){ " + matches[1] + ".messageProcessor.processMessage(" + matches[2] + ".data) } else { console.warn('removed message:', " + matches[2] + ".data); }});";

  if (decodedString.search(INSERT) != -1) {
    shouldDebug && console.log("Found Mixin that needs to be removed");
    decodedString = decodedString.replace(INSERT, matches[1] + ".messageProcessor.processMessage(" + matches[2] + ".data)");
    shouldDebug && decodedString.search(INSERT) == -1 ? console.log("Successfully removed Mixin") : console.log("Failed to remove Mixin");
  }

  return decodedString;
}