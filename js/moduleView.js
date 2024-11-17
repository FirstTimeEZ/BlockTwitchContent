import { UI, CONFIG, HTML, CSS, STYLE, TYPES, C, MV, URI } from "./exports/app/_app-constants.js";

const DOM = {
  TABS: undefined,
  TABS_CONTENT: undefined
};

const DETAILS_REGEX = /((display-name=|user-id=|badges=|badge-info=)[^\n;:.]+)/gm;
const MESSAGE_REGEX = /(PRIVMSG.+?:)([^\n]+)/;

let initialTabSet = false;
let tabStates = [];
let tabIndex = 0;

function checkAllHeads() {
  let ind = [];

  for (let index = 0; index < tabStates.length; index++) {
    const element = tabStates[index];
    if (element.useSpecifc) {
      ind.push({ streamer: element.streamer, head: element.readHead, flushCount: element.flushCount });
    }
  }

  return ind;
}

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

function createNewTabState(data) {
  const createTabButton = document.createElement(HTML.DIV);

  const toggleButton = document.createElement(HTML.DIV);
  toggleButton.className = CSS.TOGGLE_BUTTON;

  const checkbox = document.createElement(HTML.INPUT);
  checkbox.type = TYPES.CHECKBOX;
  checkbox.id = `${TYPES.BUTTON}${data.id}`;

  const label = document.createElement(HTML.LABEL);
  label.id = `${HTML.LABEL}${data.id}`;
  label.htmlFor = `${TYPES.BUTTON}${data.id}`;
  label.title = data.streamer;
  label.textContent = data.streamer;

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

      showTab(data.id);
    }
  });

  DOM.TABS.appendChild(createTabButton);

  const createTab = document.createElement(HTML.DIV);
  createTab.id = `${CSS.TAB}${data.id}`;
  createTab.className = CSS.TAB;

  const container = document.createElement(HTML.DIV);
  container.className = CSS.BASE_CONTAINER;

  const containerFlex = document.createElement(HTML.DIV);
  containerFlex.className = CSS.CONTAINER_FLEX;

  const title = document.createElement(HTML.H1);
  title.id = `${CSS.TITLE}${data.id}`;
  title.className = CSS.TITLE;
  title.textContent = `${MV.HEADING}${data.streamer}`;

  const spinner = document.createElement(HTML.IMG);
  spinner.id = `${CSS.SPINNER}${data.id}`;
  spinner.className = CSS.SPINNER;
  spinner.src = CONFIG.IMAGES.SPINNER;

  containerFlex.appendChild(title);
  containerFlex.appendChild(spinner);
  container.appendChild(containerFlex);

  const messagesDiv = document.createElement(HTML.DIV);
  messagesDiv.id = `${CSS.MESSAGES}${data.id}`;
  messagesDiv.className = CSS.MESSAGES;

  messagesDiv.appendChild(emptyStateDOM());
  container.appendChild(messagesDiv);
  createTab.appendChild(container);
  DOM.TABS_CONTENT.appendChild(createTab);

  tabStates[data.id] = { readHead: 0, message: data, streamer: data.streamer, firstRun: true, hasLoaded: false, useSpecifc: true };
  tabStates[data.id].dom = document.getElementById(`${CSS.MESSAGES}${data.id}`);
  tabStates[data.id].spinner = document.getElementById(`${CSS.SPINNER}${data.id}`);
  tabStates[data.id].spinner.style.display = STYLE.NONE;
  tabStates[data.id].uri = URI.TWITCH + data.streamer.toLowerCase();

  if (!initialTabSet) {
    showTab(data.id);
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

function renderMessages(message, dom, id) {
  if (message.values.length > tabStates[id].readHead) {
    let update = undefined;

    for (let i = message.values.length - 1; i >= tabStates[id].readHead; i--) {
      const value = message.values[i];
      if (value != undefined) {
        const parsedMessage = parseMessageDetails(value);
        const messageCard = createMessageCard(parsedMessage);
        tabStates[id].hasLoaded ? dom.insertBefore(messageCard, dom.firstChild) : dom.appendChild(messageCard), (update === undefined && (update = true));
        message.values[i] = undefined;
      }
    }

    if (update) {
      tabStates[id].hasLoaded = true;
      tabStates[id].spinner.style.display = STYLE.FLEX;
    }

    tabStates[id].readHead = message.values.length;
    tabStates[id].firstRun = false;
  }
  else if (!tabStates[id].renderedOnce && message.values.length === 0) {
    tabStates[id].readHead = 0;
    tabStates[id].hasLoaded = true;
    tabStates[id].firstRun = false;
    tabStates[id].spinner.style.display = STYLE.FLEX;
    tabStates[id].renderedOnce = true;
  }
}

document.addEventListener(UI.DOM_LOADED, () => setInterval(() => {
  browser.runtime.sendMessage({ requestContent: true, exclude: checkAllHeads() }).then((response) => {
    if (response.length > 0) {
      for (let index = 0; index < response.length; index++) {
        response[index].id = tabIndex;
        tabStates[tabIndex] === undefined && createNewTabState(response[index]);
        tabIndex++;
      }
    }
  });
}, CONFIG.HISTORY.UPDATE_MS));

document.addEventListener(UI.DOM_LOADED, () => setInterval(() => {
  let heads = checkAllHeads();
  if (heads.length > 0) {
    browser.runtime.sendMessage({ requestContentSpecific: true, indices: heads }).then((response) => {
      if (response.length > 0) {
        for (let index = 0; index < response.length; index++) {
          const element = response[index];
          let found = tabStates.find((data) => data.streamer == element.streamer);
          if (found) {
            if (element.values != undefined) {
              found.message.values.push(...element.values);
            }
            else {
              found.message.values = [];
              found.readHead = element.afterFlushCount;
            }
          }
        }
      }
    });
  }
}, CONFIG.HISTORY.UPDATE_MS));

renderPageElements();

setInterval(() => {
  for (let index = 0; index < tabStates.length; index++) {
    const tabState = tabStates[index];

    tabState && tabState.message && renderMessages(tabState.message, tabState.dom, index);
  }
}, CONFIG.HISTORY.RENDER_MS);