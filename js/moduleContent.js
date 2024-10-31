(async () => {
  const { CONFIG, STATE, logDebug } = await import(browser.runtime.getURL('') + 'js/exports.js');

  function RequestSettings(who) { // Content Script -> BackgroundWorker
    browser.runtime.sendMessage({ checkDebugSettingRequest: true },
      (response) => { // BackgroundWorker -> Content Script
        if (response != undefined) {
          console.log(who, response);
          STATE.debug = response.debugEnabled;
          STATE.enabled = response.extensionEnabled;
        }
      });
  }

  function RequestFragments() { // Content Script -> BackgroundWorker
    browser.runtime.sendMessage({ requestForFragments: true },
      (response) => { // BackgroundWorker -> Content Script
        if (response.fragments != undefined) {
          STATE.fragments = response.fragments;
          logDebug("Updated fragments", response);
        }
      });
  }

  browser.runtime.onMessage.addListener((request, sender, sendResponse) => { // Listen for messages from the BackgroundWorker
    if (sender.id == CONFIG.SENDER_UUID && sender.envType == CONFIG.SCRIPTS.OPTIONS) {
      if (request.requestFragments) {
        RequestFragments(); // Content Script -> BackgroundWorker
      }
      else if (request.requestSettings) {
        RequestSettings("contentScript"); // Content Script -> BackgroundWorker
      }
      else if (request.refreshPageRequest) {
        logDebug("content script triggered page refresh");

        location.reload();
      }
      else {
        logDebug("Unknown Request", request);
      }
    }
  });

  window.addEventListener("message", (event) => { // Listen for Messages from the Web Page Mixin
    if (STATE.enabled && event.data.completed === undefined
      && event.data.text != undefined
      && event.data.type != undefined
      && event.data.type === "fp"
      && event.data.random != undefined
      && typeof event.data.random === 'number'
      && typeof event.data.type === 'string'
      && typeof event.data.text === 'string'
      && Number.isFinite(event.data.random)) {

      logDebug("ContentScript", event.data.text, event.data.random);
      const isFragmentMatched = STATE.fragments.some(frag => frag !== "" && event.data.text.includes(frag));
      window.postMessage({ response: isFragmentMatched ? "f" : "w", completed: true, random: event.data.random }, "https://www.twitch.tv"); // Content Script -> Web Page Mixin
    }
  });

  console.log("Loading Content Script, If you see this more then once you may need to restart your browser");

  RequestFragments();
  RequestSettings("contentScript");
})();