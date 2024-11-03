export function searchFromEnd(str, word) {
  for (let i = str.length; i > 0; i--) {
    if (str.substring(i - word.length, i) === word) {
      return true;
    }
  }

  return false;
}