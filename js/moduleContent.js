(async () => {
  const { STATE, requestState } = await import(browser.runtime.getURL('') + 'js/exports/app/state.js');
  const { CONFIG, C, CM, URI, UI, COMMON_BOTS, COMMON_COMMANDS_S } = await import(browser.runtime.getURL('') + 'js/exports/app/_app-constants.js');
  const { logDebug, getTitle } = await import(browser.runtime.getURL('') + 'js/exports/app/util.js');
  const { searchFromEnd } = await import(browser.runtime.getURL('') + 'js/exports/ext/search.js');

  let blockedContent = [];
  let headUpdate = false;
  let freshContentModule = true;

  browser.runtime.onMessage.addListener((message, sender, sendResponse) => { // Listen for messages from the BackgroundModule
    if (sender.id == CONFIG.SENDER_UUID && sender.envType == CONFIG.SCRIPTS.OPTIONS) {
      if (message.refreshState) {
        requestState(CM.CONTENT);
      }
      else if (message.refreshPageRequest) {
        logDebug(CM.REFRESH);

        location.reload();
      }

      stream = getTitle();

      if (message.pastMessages) {

        if (freshContentModule || message.first) {
          freshContentModule = false;

          browser.runtime.sendMessage({ pastMessagesReply: true, new: true, remove: undefined, len: blockedContent.length, values: blockedContent, id: message.tab.id, streamer: stream, first: true });

          return;
        }

        if (headUpdate) {
          headUpdate = false;

          browser.runtime.sendMessage({ pastMessagesReply: true, new: undefined, remove: true, len: headValue, values: undefined, id: message.tab.id, streamer: stream });

          return;
        }

        browser.runtime.sendMessage({ pastMessagesReply: true, new: true, remove: undefined, len: blockedContent.length, values: blockedContent, id: message.tab.id, streamer: stream });

        if (blockedContent.length > CONFIG.HISTORY.MAX) {
          blockedContent.splice(0, blockedContent.length - CONFIG.HISTORY.RETAIN);
          headUpdate = true;
        }

        return;
      }
      else if (message.streamChanged) {
        console.log(CM.CHANGED, stream);
        blockedContent = [];
        browser.runtime.sendMessage({ streamChangedReply: true, new: undefined, remove: undefined, len: blockedContent.length, values: undefined, id: message.tab.id, streamer: stream });
      }
      else {
        logDebug(CM.UNKNOWN, message, message.tab, sender);
      }
    }
    else {
      logDebug(CM.INVALID, sender);
    }
  });

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

      let matched = false;

      if (event.data.text[0] === C.AT && searchFromEnd(event.data.text, CM.COMMENT)) {
        matched = STATE.fragments.some(frag => frag !== C.EMPTY && event.data.text.includes(frag));

        if (!matched) {
          matched = (STATE.hideCommands && COMMON_COMMANDS_S.some(frag => frag !== C.EMPTY && event.data.text.includes(frag)));

          if (!matched) {
            matched = (STATE.hideBots && COMMON_BOTS.some(frag => frag !== C.EMPTY && event.data.text.includes(frag)));
          }
        }

        if (matched) {
          blockedContent.push(event.data.text);
        }

        logDebug(CM.MIXIN, event.data.text, event.data.random, matched);
      }

      window.postMessage({ response: matched ? CM.FRAG_F : CM.FRAG_W, completed: true, random: event.data.random }, URI.TWITCH); // Content Script -> Web Page Mixin
    }
  });

  requestState(CM.CONTENT);
  console.log(CM.LOADED, getTitle());
})();