const DOM = {
  messages: document.getElementById('messages')
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
  img.alt = `${type} icon`;
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

function renderMessages(messages) {
  DOM.messages.innerHTML = '';

  if (!messages || messages.length === 0) {
    DOM.messages.innerHTML = `
    <div class="empty-state">
        <p>No messages have been blocked yet. Please refresh soon.</p>
    </div>
    `;
    return;
  }

  for (let i = messages.length - 1; i >= 0; i--) {
    const parsedMessage = parseMessageDetails(messages[i]);
    const messageCard = createMessageCard(parsedMessage);
    DOM.messages.appendChild(messageCard);
  }
}

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.pastMessagesReply !== undefined) {
    renderMessages(message.pastMessagesReply);
  }
});

document.addEventListener('DOMContentLoaded', () => {
  browser.runtime.sendMessage({ requestPastMessages: true });
});