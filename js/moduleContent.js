(async () => {
  const { STATE, requestState, logDebug } = await import(browser.runtime.getURL('') + 'js/exports/exports.js');
  const { CONFIG, C } = await import(browser.runtime.getURL('') + 'js/exports/constants.js');

  browser.runtime.onMessage.addListener((message, sender, sendResponse) => { // Listen for messages from the BackgroundModule
    if (sender.id == CONFIG.SENDER_UUID && sender.envType == CONFIG.SCRIPTS.OPTIONS) {
      if (message.refreshState) {
        requestState(C.CM.CONTENT);
      }
      else if (message.refreshPageRequest) {
        logDebug(C.CM.REFRESH);

        location.reload();
      }
      else {
        logDebug(C.CM.UNKNOWN, message, sender);
      }
    }
    else {
      logDebug(C.CM.INVALID, sender);
    }
  });

  window.addEventListener("message", (event) => { // Listen for Messages from the Web Page Mixin
    if (STATE.enabled && event.data.completed === undefined
      && event.data.text != undefined
      && event.data.type != undefined
      && event.data.type === C.FRAG_P
      && event.data.random != undefined
      && typeof event.data.random === C.NUMBER
      && typeof event.data.type === C.STRING
      && typeof event.data.text === C.STRING
      && Number.isFinite(event.data.random)) {

      logDebug(C.CM.MIXIN, event.data.text, event.data.random);

      const isFragmentMatched = STATE.fragments.some(frag => frag !== C.EMPTY && event.data.text.includes(frag));
      window.postMessage({ response: isFragmentMatched ? C.FRAG_F : C.FRAG_W, completed: true, random: event.data.random }, C.TWITCH); // Content Script -> Web Page Mixin
    }
  });

  requestState(C.CM.CONTENT);
  console.log(C.CM.LOADED);
})();