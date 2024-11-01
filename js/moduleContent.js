(async () => {
  const { STATE, requestState } = await import(browser.runtime.getURL('') + 'js/exports/state.js');
  const { CONFIG, C, CM } = await import(browser.runtime.getURL('') + 'js/exports/constants.js');
  const { logDebug } = await import(browser.runtime.getURL('') + 'js/exports/util.js');
  
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => { // Listen for messages from the BackgroundModule
    if (sender.id == CONFIG.SENDER_UUID && sender.envType == CONFIG.SCRIPTS.OPTIONS) {
      if (message.refreshState) {
        requestState(CM.CONTENT);
      }
      else if (message.refreshPageRequest) {
        logDebug(CM.REFRESH);

        location.reload();
      }
      else {
        logDebug(CM.UNKNOWN, message, sender);
      }
    }
    else {
      logDebug(CM.INVALID, sender);
    }
  });

  window.addEventListener("message", (event) => { // Listen for Messages from the Web Page Mixin
    if (STATE.enabled && event.data.completed === undefined
      && event.data.text != undefined
      && event.data.type != undefined
      && event.data.type === CM.FRAG_P
      && event.data.random != undefined
      && typeof event.data.random === C.NUMBER
      && typeof event.data.type === C.STRING
      && typeof event.data.text === C.STRING
      && Number.isFinite(event.data.random)) {

      logDebug(CM.MIXIN, event.data.text, event.data.random);

      const isFragmentMatched = STATE.fragments.some(frag => frag !== C.EMPTY && event.data.text.includes(frag));
      window.postMessage({ response: isFragmentMatched ? CM.FRAG_F : CM.FRAG_W, completed: true, random: event.data.random }, CM.TWITCH); // Content Script -> Web Page Mixin
    }
  });

  requestState(CM.CONTENT);
  console.log(CM.LOADED);
})();