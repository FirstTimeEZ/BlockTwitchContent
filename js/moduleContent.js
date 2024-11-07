(async () => {
  const { STATE, requestState } = await import(browser.runtime.getURL('') + 'js/exports/app/state.js');
  const { CONFIG, C, CM, URI, UI, COMMON_BOTS, COMMON_COMMANDS_S } = await import(browser.runtime.getURL('') + 'js/exports/app/_app-constants.js');
  const { logDebug, getTitle } = await import(browser.runtime.getURL('') + 'js/exports/app/util.js');
  const { searchFromEnd } = await import(browser.runtime.getURL('') + 'js/exports/ext/search.js');

  let blockedContent = [];

  let lastSent = 0;
  let lastStreamer = "";
  let lastStreamerLower = "";
  let timesFlushed = 0;

  function searchComment(event) {
    if (event.data.text[0] === C.AT && searchFromEnd(event.data.text, CM.COMMENT)) {
      matched = STATE.fragments.some(frag => frag !== C.EMPTY && searchFromEnd(event.data.text, frag));

      if (!matched) {
        matched = (STATE.hideCommands && COMMON_COMMANDS_S.some(frag => frag !== C.EMPTY && searchFromEnd(event.data.text, frag)));

        if (!matched) {
          matched = (STATE.hideBots && COMMON_BOTS.some(frag => frag !== C.EMPTY && searchFromEnd(event.data.text, frag)));
        }
      }

      matched && collectComment(event.data.text);

      logDebug(CM.MIXIN, event.data.text, event.data.random, matched);

      return matched;
    }

    return false;
  }

  function flush() {
    blockedContent.splice(0, blockedContent.length - CONFIG.HISTORY.RETAIN);
    timesFlushed++;
  }

  function createMessage() {
    lastSent = blockedContent.length;
    return { contentModuleUpdate: true, streamer: lastStreamer, values: blockedContent, readto: lastSent, timesflushed: timesFlushed };
  }

  function checkStreamHasChanged() {
    const stream = getTitle();

    if (stream && lastStreamer !== stream) {
      lastStreamer = stream;
      lastStreamerLower = stream.toLowerCase();
      lastSent = 0;
      timesFlushed = 0;
      blockedContent = [];

      if (document.querySelector(CONFIG.VIDEO_PLAYER) !== null) {
        const m = createMessage();
        m.readto = -1;
        browser.runtime.sendMessage(m);
      }

      console.log(CM.LOADED, stream);
    }
  }

  function collectComment(comment) {
    searchFromEnd(comment, lastStreamerLower) && blockedContent.push(comment);
  }

  window.addEventListener(UI.MESSAGE, (event) => { // Listen for Messages from the Web Page Mixin
    if (STATE.enabled && event.data.completed === undefined
      && event.data.text != undefined
      && event.data.type != undefined
      && event.data.type === CM.FRAG_P
      && event.data.random != undefined
      && typeof event.data.random === C.NUMBER
      && typeof event.data.type === C.STRING
      && typeof event.data.text === C.STRING
      && Number.isFinite(event.data.random)) {

      window.postMessage({ response: searchComment(event) ? CM.FRAG_F : CM.FRAG_W, completed: true, random: event.data.random }, URI.TWITCH); // Content Script -> Web Page Mixin
    }
  });

  browser.runtime.onMessage.addListener((message, sender, sendResponse) => { // Listen for messages from the BackgroundModule
    if (sender.id == CONFIG.SENDER_UUID && sender.envType == CONFIG.SCRIPTS.OPTIONS) {
      if (message.refreshState) {
        requestState(CM.CONTENT);

        return;
      }

      if (message.refreshPageRequest) {
        logDebug(CM.REFRESH);

        location.reload();

        return;
      }

      logDebug(CM.UNKNOWN, message, message.tab, sender);
    }
    else {
      logDebug(CM.INVALID, sender);
    }
  });

  setInterval(() => {
    if (blockedContent.length > lastSent) {
      blockedContent.length > CONFIG.HISTORY.MAX && flush();
      browser.runtime.sendMessage(createMessage());
    }
  }, CONFIG.HISTORY.UPDATE_MS);

  new MutationObserver(() => checkStreamHasChanged()).observe(document.querySelector('title'), { childList: true });
  requestState(CM.CONTENT);
})();
