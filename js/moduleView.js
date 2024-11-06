import { isTwitchTab, sendMessageToTab } from "./exports/app/tabs.js";
import { UI, CONFIG, HTML, CSS, STYLE, TYPES, C, MV } from "./exports/app/_app-constants.js";

const DOM = {
  TABS: undefined,
  TABS_CONTENT: undefined
};

const DETAILS_REGEX = /((display-name=|user-id=|badges=|badge-info=)[^\n;:.]+)/gm;
const MESSAGE_REGEX = /(PRIVMSG.+?:)([^\n]+)/;

let initialTabSet = false;
let indexedTabStates = [];

function createMessageCard(messageData) {
  const card = document.createElement(HTML.DIV);
  card.className = CSS.MESSAGE_CARD;

  const content = document.createElement(HTML.DIV);
  content.className = CSS.MESSAGE_CONTENT;
  content.textContent = messageData.content;
  card.appendChild(content);

  const detailsList = document.createElement(HTML.DIV);
  detailsList.className = CSS.CARD_DETAIL_LIST;

  messageData.details.forEach(detail => {
    const detailItem = document.createElement(HTML.DIV);
    detailItem.className = CSS.CARD_DETAIL_ITEM;

    const icon = getIconForDetail(detail.type);
    detailItem.appendChild(icon);

    const text = document.createElement(HTML.SPAN);
    text.textContent = `${detail.type}=${detail.value}`;
    detailItem.appendChild(text);

    detailsList.appendChild(detailItem);
  });

  card.appendChild(detailsList);
  return card;
}

function getIconForDetail(type) {
  const img = document.createElement(HTML.IMG);
  const iconPath = {
    'display-name': 'icons/display-name.png',
    'user-id': 'icons/user-id.png',
    'badges': 'icons/badge.png',
    'badge-info': 'icons/badge-info.png'
  }[type] || 'icons/badge-info.png';

  img.src = iconPath;
  img.classList.add(CSS.CARD_DETAIL);

  return img;
}

function parseMessageDetails(message) {
  const messageMatch = MESSAGE_REGEX.exec(message);

  const uniqueDetails = new Set([...message.matchAll(DETAILS_REGEX)].map(match => match[1]));

  const details = Array.from(uniqueDetails).map(detail => {
    const [type, value] = detail.split(C.EQUALS);
    return { type, value };
  });

  return {
    fullMessage: message,
    content: messageMatch ? messageMatch[2] : C.EMPTY,
    details
  };
}

function renderMessages(message, tab, dom) {
  if (message.new && message.len > tab.readHead) {
    let update = undefined;

    for (let i = message.len - 1; i >= tab.readHead; i--) {
      const parsedMessage = parseMessageDetails(message.values[i]);
      const messageCard = createMessageCard(parsedMessage);

      indexedTabStates[message.id].hasLoaded ? dom.insertBefore(messageCard, dom.firstChild) : dom.appendChild(messageCard), (update === undefined && (update = true));
    }

    if (update) {
      indexedTabStates[message.id].hasLoaded = true;
      indexedTabStates[message.id].spinner.style.display = STYLE.FLEX;
    }

    tab.readHead = message.len;
    indexedTabStates[message.id].firstRun = false;
  }
  else if (message.remove) {
    message.remove = undefined;

    tab.readHead = message.len;

    browser.tabs.query({}).then((tabs) => tabs.forEach(tab => {
      isTwitchTab(tab) && tab.id == message.id && sendMessageToTab(tab, { pastMessages: true });
    }));
  }
  else if (message.first) {
    message.first = undefined;

    indexedTabStates[message.id].hasLoaded = true;
    indexedTabStates[message.id].firstRun = false;
    indexedTabStates[message.id].spinner.style.display = STYLE.FLEX;
  }
}

function showTab(tabId) {
  const tabs = document.querySelectorAll(`.${CSS.TAB}`);
  tabs.forEach(tab => { tab.classList.remove(UI.ACTIVE); });
  document.getElementById(`${CSS.TAB}${tabId}`).classList.add(UI.ACTIVE);

  const button = document.getElementById(`${TYPES.BUTTON}${tabId}`);
  button.classList.add(UI.ACTIVE);
  button.checked = true;
}

function emptyStateDOM() {
  const emptyState = document.createElement(HTML.DIV);
  emptyState.className = CSS.EMPTY_STATE;

  const emptyMessage = document.createElement(HTML.PARAGRAPH);
  emptyMessage.textContent = MV.EMPTY_STATE_MESSAGE;

  emptyState.appendChild(emptyMessage);

  return emptyState;
}

function streamChanged(message) {
  if (indexedTabStates[message.id].streamer != message.streamer) {
    const titleElement = document.getElementById(`${CSS.TITLE}${message.id}`);
    const labelElement = document.getElementById(`${HTML.LABEL}${message.id}`);

    if (titleElement) {
      document.getElementById(`${CSS.TITLE}${message.id}`).textContent = `${MV.HEADING}${message.streamer}`;
    }

    if (labelElement) {
      document.getElementById(`${HTML.LABEL}${message.id}`).textContent = message.streamer;
    }

    indexedTabStates[message.id].streamer = message.streamer;
    indexedTabStates[message.id].message = message;
    indexedTabStates[message.id].readHead = 0;
    indexedTabStates[message.id].pastMessagesReply = true;
    indexedTabStates[message.id].hasLoaded = false;
    indexedTabStates[message.id].firstRun = true;

    indexedTabStates[message.id].dom.innerHTML = C.EMPTY;
    indexedTabStates[message.id].dom.appendChild(emptyStateDOM());
  }
}

function createNewTabState(message) {
  const createTabButton = document.createElement(HTML.DIV);

  const toggleButton = document.createElement(HTML.DIV);
  toggleButton.className = CSS.TOGGLE_BUTTON;

  const checkbox = document.createElement(HTML.INPUT);
  checkbox.type = TYPES.CHECKBOX;
  checkbox.id = `${TYPES.BUTTON}${message.id}`;

  const label = document.createElement(HTML.LABEL);
  label.id = `${HTML.LABEL}${message.id}`;
  label.htmlFor = `${TYPES.BUTTON}${message.id}`;
  label.title = message.streamer;
  label.textContent = message.streamer;

  toggleButton.appendChild(checkbox);
  toggleButton.appendChild(label);
  createTabButton.appendChild(toggleButton);

  toggleButton.addEventListener(UI.CLICK, (e) => {

    if (!e.target.checked) {
      e.target.checked = true;
    }
    else {
      document.querySelectorAll('[type="checkbox"]').forEach(button => {
        if (e.target.id != button.id) {
          button.checked = false;
          button.classList.remove(UI.ACTIVE);
        }
      });

      showTab(message.id);
    }
  });

  DOM.TABS.appendChild(createTabButton);

  const createTab = document.createElement(HTML.DIV);
  createTab.id = `${CSS.TAB}${message.id}`;
  createTab.className = CSS.TAB;

  const container = document.createElement(HTML.DIV);
  container.className = CSS.BASE_CONTAINER;

  const containerFlex = document.createElement(HTML.DIV);
  containerFlex.className = CSS.CONTAINER_FLEX;

  const title = document.createElement(HTML.H1);
  title.id = `${CSS.TITLE}${message.id}`;
  title.className = CSS.TITLE;
  title.textContent = `${MV.HEADING}${message.streamer}`;

  const spinner = document.createElement(HTML.IMG);
  spinner.id = `${CSS.SPINNER}${message.id}`;
  spinner.className = CSS.SPINNER;
  spinner.src = CONFIG.IMAGES.SPINNER;

  containerFlex.appendChild(title);
  containerFlex.appendChild(spinner);
  container.appendChild(containerFlex);

  const messagesDiv = document.createElement(HTML.DIV);
  messagesDiv.id = `${CSS.MESSAGES}${message.id}`;
  messagesDiv.className = CSS.MESSAGES;

  messagesDiv.appendChild(emptyStateDOM());
  container.appendChild(messagesDiv);
  createTab.appendChild(container);
  DOM.TABS_CONTENT.appendChild(createTab);

  indexedTabStates[message.id] = { readHead: 0, message: message, streamer: message.streamer };
  indexedTabStates[message.id].firstRun = true;
  indexedTabStates[message.id].dom = document.getElementById(`${CSS.MESSAGES}${message.id}`);
  indexedTabStates[message.id].spinner = document.getElementById(`${CSS.SPINNER}${message.id}`);
  indexedTabStates[message.id].spinner.style.display = STYLE.NONE;

  if (!initialTabSet) {
    showTab(message.id);
    initialTabSet = true;
  }
}

function renderPageElements() {
  const spinner = document.createElement(HTML.IMG);
  spinner.src = CONFIG.IMAGES.SPINNER;
  spinner.className = CSS.SPINNER;
  spinner.id = CSS.SPINNER;

  const tabs = document.createElement(HTML.DIV);
  tabs.className = CSS.TABS;
  tabs.id = CSS.TABS;

  const containerFlex = document.createElement(HTML.DIV);
  containerFlex.className = CSS.CONTAINER_FLEX;
  containerFlex.appendChild(tabs);
  containerFlex.appendChild(spinner);

  const tabsContent = document.createElement(HTML.DIV);
  tabsContent.className = CSS.TAB_CONTENT;
  tabsContent.id = CSS.TAB_CONTENT;

  const tabContainer = document.getElementById(CSS.TAB_CONTAINER);
  tabContainer.appendChild(containerFlex);
  tabContainer.appendChild(tabsContent);

  DOM.TABS = document.getElementById(CSS.TABS);
  DOM.TABS_CONTENT = document.getElementById(CSS.TAB_CONTENT);
}

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.streamChangedReply) {
    streamChanged(message);
  }
  else if (message.pastMessagesReply) {
    !indexedTabStates[message.id] ? createNewTabState(message) : (indexedTabStates[message.id].message = message);
  }
});

document.addEventListener(UI.DOM_LOADED, () => {
  setInterval(() => {
    browser.tabs.query({}).then((tabs) => tabs.forEach(tab => {
      isTwitchTab(tab) && sendMessageToTab(tab, { pastMessages: true, first: indexedTabStates[tab.id] != undefined ? indexedTabStates[tab.id].firstRun : true });
    }));
  }, CONFIG.HISTORY.UPDATE_MS);
});

renderPageElements();

setInterval(() => {
  for (let index = 0; index < indexedTabStates.length; index++) {
    const tabState = indexedTabStates[index];

    tabState && tabState.message && renderMessages(tabState.message, tabState, tabState.dom);
  }
}, CONFIG.HISTORY.RENDER_MS);