export function definedContentRules(text, item) {
  const splitText = text.split("=");
  if (splitText.length > 1 && splitText[1] != "") {
    if (text.includes("user-type=")) {
      if (splitText[1].trim().includes(item.sender.__typename)) {
        return true;
      }
    }

    if (text.includes("user-id=")) {
      if (splitText[1].trim().includes(item.sender.id)) {
        return true;
      }
    }

    if (text.includes("display-name=")) {
      if (splitText[1].trim().includes(item.sender.displayName)) {
        return true;
      }
    }
  }

  return false;
}