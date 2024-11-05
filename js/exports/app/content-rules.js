import { C, CR } from "./_app-constants.js";

export function definedContentRules(text, item) {

  const splitText = text.split(C.EQUALS);
  if (splitText.length > 1 && splitText[1] != C.EMPTY) {
    if (text.includes(CR.USER_TYPE)) {
      if (splitText[1].trim().includes(item.sender.__typename)) {
        return true;
      }
    }

    if (text.includes(CR.USER_ID)) {
      if (splitText[1].trim().includes(item.sender.id)) {
        return true;
      }
    }

    if (text.includes(CR.USER_DISPLAY_NAME)) {
      if (splitText[1].trim().includes(item.sender.displayName)) {
        return true;
      }
    }
  }

  return false;
}