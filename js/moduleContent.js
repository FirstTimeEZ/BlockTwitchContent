(async () => {
  const { STATE, requestState } = await import(browser.runtime.getURL('') + 'js/exports/app/state.js');
  const { CONFIG, C, CM, URI, UI, COMMON_BOTS, COMMON_COMMANDS_S } = await import(browser.runtime.getURL('') + 'js/exports/app/_app-constants.js');
  const { logDebug } = await import(browser.runtime.getURL('') + 'js/exports/app/util.js');
  const { searchFromEnd } = await import(browser.runtime.getURL('') + 'js/exports/ext/search.js');

  const CAPTURED = [];

  let headValue = 0;
  let headUpdate = false;

  browser.runtime.onMessage.addListener((message, sender, sendResponse) => { // Listen for messages from the BackgroundModule
    if (sender.id == CONFIG.SENDER_UUID && sender.envType == CONFIG.SCRIPTS.OPTIONS) {
      if (message.refreshState) {
        requestState(CM.CONTENT);
      }
      else if (message.refreshPageRequest) {
        logDebug(CM.REFRESH);

        location.reload();
      }
      else if (message.pastMessages) {
        if (message.first) {
          headValue = CAPTURED.length;

          browser.runtime.sendMessage({ pastMessagesReply: true, new: true, remove: undefined, len: CAPTURED.length, values: CAPTURED });
        } else {
          if (CAPTURED.length > headValue) {
            headValue = CAPTURED.length;

            browser.runtime.sendMessage({ pastMessagesReply: true, new: true, remove: undefined, len: CAPTURED.length, values: CAPTURED });

            if (CAPTURED.length > 225) {
              CAPTURED.splice(0, CAPTURED.length - 50);
              headValue = CAPTURED.length;
              headUpdate = true;
            }
          }
          else if (headUpdate) {
            headUpdate = false;

            browser.runtime.sendMessage({ pastMessagesReply: true, new: undefined, remove: true, len: headValue, values: undefined });
          }
        }
      }
      else {
        logDebug(CM.UNKNOWN, message, sender);
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
          CAPTURED.push(event.data.text);
        }

        logDebug(CM.MIXIN, event.data.text, event.data.random, matched);
      }

      window.postMessage({ response: matched ? CM.FRAG_F : CM.FRAG_W, completed: true, random: event.data.random }, URI.TWITCH); // Content Script -> Web Page Mixin
    }
  });

  requestState(CM.CONTENT);
  console.log(CM.LOADED);
})();