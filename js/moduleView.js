import { STATE, requestState } from "./exports/state.js";

const DOM = {
  MESSAGES: document.getElementsByClassName("messages")
}

requestState("viewModule", () => {
  console.log(DOM.MESSAGES[0], STATE);
});

browser.runtime.sendMessage({ requestPastMessages: true });

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.pastMessagesReply) {
    if (message.pastMessagesReply == undefined || message.pastMessagesReply.length == 0) {
      const newMessage = document.createElement('p');
      newMessage.textContent = "No Messages have been blocked yet, Refresh soon";
      DOM.MESSAGES[0].appendChild(newMessage);
    }
    else {
      for (let index = message.pastMessagesReply.length - 1; index > 0; index--) {
        const element = message.pastMessagesReply[index];
        const newMessage = document.createElement('p');
        newMessage.textContent = element;
        DOM.MESSAGES[0].appendChild(newMessage);
      }
    }
  }
});

