import { isTwitchTab, sendMessageToTab } from "./exports/app/tabs.js";

let initialTabSet = false;
let indexedTabStates = [];

const DOM = {
  TABS: undefined,
  TABS_CONTENT: undefined
};

const DETAILS_REGEX = /((display-name=|user-id=|badges=|badge-info=)[^\n;:.]+)/gm;
const MESSAGE_REGEX = /(PRIVMSG.+?:)([^\n]+)/;

function createMessageCard(messageData) {
  const card = document.createElement('div');
  card.className = 'message-card';

  const content = document.createElement('div');
  content.className = 'message-content';
  content.textContent = messageData.content;
  card.appendChild(content);

  const detailsList = document.createElement('div');
  detailsList.className = 'details-list';

  messageData.details.forEach(detail => {
    const detailItem = document.createElement('div');
    detailItem.className = 'detail-item';

    const icon = getIconForDetail(detail.type);
    detailItem.appendChild(icon);

    const text = document.createElement('span');
    text.textContent = `${detail.type}=${detail.value}`;
    detailItem.appendChild(text);

    detailsList.appendChild(detailItem);
  });

  card.appendChild(detailsList);
  return card;
}

function getIconForDetail(type) {
  const img = document.createElement('img');
  const iconPath = {
    'display-name': 'icons/display-name.png',
    'user-id': 'icons/user-id.png',
    'badges': 'icons/badge.png',
    'badge-info': 'icons/badge-info.png'
  }[type] || 'icons/badge-info.png';

  img.src = iconPath;
  img.classList.add("card-icon-detail");

  return img;
}

function parseMessageDetails(message) {
  const messageMatch = MESSAGE_REGEX.exec(message);

  const uniqueDetails = new Set([...message.matchAll(DETAILS_REGEX)].map(match => match[1]));

  const details = Array.from(uniqueDetails).map(detail => {
    const [type, value] = detail.split('=');
    return { type, value };
  });

  return {
    fullMessage: message,
    content: messageMatch ? messageMatch[2] : '',
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
      indexedTabStates[message.id].spinner.style.display = "flex";
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
    indexedTabStates[message.id].spinner.style.display = "flex";
  }
}

function showTab(tabId) {
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(tab => { tab.classList.remove('active'); });
  document.getElementById(`tab${tabId}`).classList.add('active');

  const button = document.getElementById(`button${tabId}`);
  button.classList.add('active');
  button.checked = true;
}

function emptyStateDOM() {
  const emptyState = document.createElement('div');
  emptyState.className = 'empty-state';

  const emptyMessage = document.createElement('p');
  emptyMessage.textContent = `New messages will be added automatically above, Old messages appear below.
  If there are no messages, nothing has been blocked, You can wait or come back later.
  `;

  emptyState.appendChild(emptyMessage);

  return emptyState;
}

function streamChanged(message) {
  if (indexedTabStates[message.id].streamer != message.streamer) {
    const titleElement = document.getElementById(`title${message.id}`);
    const labelElement = document.getElementById(`label${message.id}`);

    if (titleElement) {
      document.getElementById(`title${message.id}`).textContent = `Removed Message History for ${message.streamer}`;
    }

    if (labelElement) {
      document.getElementById(`label${message.id}`).textContent = message.streamer;
    }

    indexedTabStates[message.id].streamer = message.streamer;
    indexedTabStates[message.id].message = message;
    indexedTabStates[message.id].readHead = 0;
    indexedTabStates[message.id].pastMessagesReply = true;
    indexedTabStates[message.id].hasLoaded = false;
    indexedTabStates[message.id].firstRun = true;

    indexedTabStates[message.id].dom.innerHTML = ``;
    indexedTabStates[message.id].dom.appendChild(emptyStateDOM());
  }
}

function createNewTabState(message) {
  const createTabButton = document.createElement('div');

  const toggleButton = document.createElement('div');
  toggleButton.className = 'toggle-button';

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.id = `button${message.id}`;

  const label = document.createElement('label');
  label.id = `label${message.id}`;
  label.htmlFor = `button${message.id}`;
  label.title = message.streamer;
  label.textContent = message.streamer;

  toggleButton.appendChild(checkbox);
  toggleButton.appendChild(label);
  createTabButton.appendChild(toggleButton);

  toggleButton.addEventListener("click", (e) => {

    if (!e.target.checked) {
      e.target.checked = true;
    }
    else {
      document.querySelectorAll('[type="checkbox"]').forEach(button => {
        if (e.target.id != button.id) {
          button.checked = false;
          button.classList.remove("active");
        }
      });

      showTab(message.id);
    }
  });

  DOM.TABS.appendChild(createTabButton);

  const createTab = document.createElement('div');
  createTab.className = 'tab';
  createTab.id = `tab${message.id}`;

  const container = document.createElement('div');
  container.className = 'container containerRem';

  const containerFlex = document.createElement('div');
  containerFlex.className = 'container-flex';

  const title = document.createElement('h1');
  title.className = 'title';
  title.id = `title${message.id}`;
  title.textContent = `Removed Message History for ${message.streamer}`;

  const spinner = document.createElement('img');
  spinner.src = '/icons/waiting.gif';
  spinner.className = 'waitingSmall';
  spinner.id = `waitingSmall${message.id}`;

  containerFlex.appendChild(title);
  containerFlex.appendChild(spinner);
  container.appendChild(containerFlex);

  const messagesDiv = document.createElement('div');
  messagesDiv.id = `messages${message.id}`;
  messagesDiv.className = 'messages';

  messagesDiv.appendChild(emptyStateDOM());
  container.appendChild(messagesDiv);
  createTab.appendChild(container);
  DOM.TABS_CONTENT.appendChild(createTab);

  indexedTabStates[message.id] = { readHead: 0, message: message, streamer: message.streamer };
  indexedTabStates[message.id].firstRun = true;
  indexedTabStates[message.id].dom = document.getElementById(`messages${message.id}`);
  indexedTabStates[message.id].spinner = document.getElementById(`waitingSmall${message.id}`);
  indexedTabStates[message.id].spinner.style.display = "none";

  if (!initialTabSet) {
    showTab(message.id);
    initialTabSet = true;
  }
}

function renderPageElements() {
  const spinner = document.createElement('img');
  spinner.src = '/icons/waiting.gif';
  spinner.className = "waitingSmall";
  spinner.id = "waitingSmall";

  const tabs = document.createElement('div');
  tabs.className = 'tabs';
  tabs.id = 'tabs';

  const containerFlex = document.createElement('div');
  containerFlex.className = 'container-flex';
  containerFlex.appendChild(tabs);
  containerFlex.appendChild(spinner);

  const tabsContent = document.createElement('div');
  tabsContent.className = 'tab-content';
  tabsContent.id = 'tab-content';

  const tabContainer = document.getElementById("tc");
  tabContainer.appendChild(containerFlex);
  tabContainer.appendChild(tabsContent);

  DOM.TABS = document.getElementById('tabs');
  DOM.TABS_CONTENT = document.getElementById('tab-content');
}

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.streamChangedReply) {
    streamChanged(message);
  }
  else if (message.pastMessagesReply) {
    !indexedTabStates[message.id] ? createNewTabState(message) : (indexedTabStates[message.id].message = message);
  }
});

document.addEventListener('DOMContentLoaded', () => {
  setInterval(() => {
    browser.tabs.query({}).then((tabs) => tabs.forEach(tab => {
      isTwitchTab(tab) && sendMessageToTab(tab, { pastMessages: true, first: indexedTabStates[tab.id] != undefined ? indexedTabStates[tab.id].firstRun : true });
    }));
  }, 1000);
});

renderPageElements();

setInterval(() => {
  for (let index = 0; index < indexedTabStates.length; index++) {
    const tabState = indexedTabStates[index];

    tabState && tabState.message && renderMessages(tabState.message, tabState, tabState.dom);
  }
}, 750);