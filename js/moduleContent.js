(async () => {
  const { CONFIG, STATE, requestState, logDebug } = await import(browser.runtime.getURL('') + 'js/exports/exports.js');

  browser.runtime.onMessage.addListener((message, sender, sendResponse) => { // Listen for messages from the BackgroundModule
    if (sender.id == CONFIG.SENDER_UUID && sender.envType == CONFIG.SCRIPTS.OPTIONS) {
      if (message.refreshState) {
        requestState("contentModule");
      }
      else if (message.refreshPageRequest) {
        logDebug("contentModule::refreshPageRequest");

        location.reload();
      }
      else {
        logDebug("contentModule::unknownMessage", message, sender);
      }
    }
    else {
      logDebug("contentModule::invalidMessage", sender);
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

      logDebug("contentModule::mixinMessage", event.data.text, event.data.random);

      const isFragmentMatched = STATE.fragments.some(frag => frag !== "" && event.data.text.includes(frag));
      window.postMessage({ response: isFragmentMatched ? "f" : "w", completed: true, random: event.data.random }, "https://www.twitch.tv"); // Content Script -> Web Page Mixin
    }
  });

  requestState("contentModule");
  console.log("contentModule::Loaded");
})();