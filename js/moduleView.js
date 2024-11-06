let firstUpdate = true;
let hasLoaded = false;
let tabActive = false;

let tabSettings = [];

const DOM = {
  MESSAGES: document.getElementById('messages'),
  TAB1: document.getElementById('tab1b'),
  TAB2: document.getElementById('tab2b'),
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

    if (tabSettings[message.id].firstMessage) {
      tabSettings[message.id].dom.innerHTML = ``;
      tabSettings[message.id].firstMessage = false;
    }

    if (hasLoaded) {
      for (let i = message.len - 1; i >= tab.readHead; i--) {
        const parsedMessage = parseMessageDetails(message.values[i]);
        const messageCard = createMessageCard(parsedMessage);
        dom.insertBefore(messageCard, dom.firstChild);
      }
    }
    else {
      tabSettings[message.id].spinner.style.display = "flex";

      for (let i = message.len - 1; i >= tab.readHead; i--) {
        const parsedMessage = parseMessageDetails(message.values[i]);
        const messageCard = createMessageCard(parsedMessage);
        dom.appendChild(messageCard);
      }
    }

    tab.readHead = message.len;

    return true;
  }
  else if (message.remove) {
    message.remove = undefined;

    tab.readHead = message.len;

    browser.runtime.sendMessage({ requestPastMessages: true, flushed: true, first: false });
  }

  return false;
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

  const emptySpinner = document.createElement('img');
  emptySpinner.src = '/icons/waiting.gif';
  emptySpinner.className = 'waitingSmall';

  const emptyMessage = document.createElement('p');
  emptyMessage.textContent = `No messages have been blocked yet. You can come back later or wait. New messages will be added automatically.`;

  emptyState.appendChild(emptySpinner);
  emptyState.appendChild(emptyMessage);

  return emptyState;
}

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.streamChangedReply) {
    if (tabSettings[message.id].streamer != message.streamer) {
      const titleElement = document.getElementById(`title${message.id}`);
      const labelElement = document.getElementById(`label${message.id}`);

      if (titleElement) {
        document.getElementById(`title${message.id}`).textContent = `Removed Message History for ${message.streamer}`;
      }

      if (labelElement) {
        document.getElementById(`label${message.id}`).textContent = message.streamer;
      }

      tabSettings[message.id].streamer = message.streamer;
      tabSettings[message.id].message = message;
      tabSettings[message.id].readHead = 0;
      tabSettings[message.id].pastMessagesReply = true;
      tabSettings[message.id].firstMessage = true;

      tabSettings[message.id].dom.innerHTML = ``;
      tabSettings[message.id].dom.appendChild(emptyStateDOM());

      firstUpdate = true;
    }
  }
  else if (message.pastMessagesReply) {
    if (!tabSettings[message.id]) {
      tabSettings[message.id] = { readHead: 0, message: message, firstMessage: true, streamer: message.streamer };
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

      tabSettings[message.id].dom = document.getElementById(`messages${message.id}`);
      tabSettings[message.id].spinner = document.getElementById(`waitingSmall${message.id}`);

      if (!tabActive) {
        showTab(message.id);
        tabActive = true;
      }
    } else {
      tabSettings[message.id].message = message;
      console.log(tabSettings[message.id].message);
    }
  }
});

document.addEventListener('DOMContentLoaded', () => {
  browser.runtime.sendMessage({ requestPastMessages: true, flushed: false, first: firstUpdate });
  setInterval(() => {
    browser.runtime.sendMessage({ requestPastMessages: true, flushed: false, first: firstUpdate });
  }, 1100);
});

setInterval(() => {
  let anyLoaded = false;

  for (let index = 0; index < tabSettings.length; index++) {
    const element = tabSettings[index];

    if (element && element.message) {

      const thisElementLoaded = renderMessages(element.message, element, element.dom);

      !anyLoaded && thisElementLoaded && (anyLoaded = true);
    }
  }

  if (anyLoaded) {
    firstUpdate = false;
    hasLoaded = true;
  }
}, 1000);

var tabContainer = document.getElementById("tc");

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

tabContainer.appendChild(containerFlex);

const tabsContent = document.createElement('div');
tabsContent.className = 'tab-content';
tabsContent.id = 'tab-content';

tabContainer.appendChild(tabsContent);

DOM.TABS = document.getElementById('tabs');
DOM.TABS_CONTENT = document.getElementById('tab-content');