/**
 * Searches for the last occurrence of a specified word in a given string, 
 * starting from the end of the string.
 *
 * @param {string} str - The string in which to search for the word.
 * @param {string} word - The word to search for in the string.
 * @returns {number|null} The index of the last occurrence of the word in the string, 
 *                       or null if the word is not found.
 */
export function searchFromEnd(str, word) {
  let c = 0;
  const wl = word.length - 1;

  for (let i = str.length - 1; i > 0; i--) {
    if (str[i] === word[wl]) {
      for (let ii = 0; ii < word.length; ii++) {
        if (word[wl - ii] == str[i - ii]) {
          c++;

          if (c == word.length) {
            return i;
          }
        }
        else {
          c = 0;

          break;
        }
      }
    }
  }

  return null;
}