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
  const wordLenMinusOne = word.length - 1;
  let s = 0;
  for (let index = str.length - 1; index > 0; index--) {
    if (str[index] === word[wordLenMinusOne]) {
      for (let innerIndex = 0; innerIndex < word.length; innerIndex++) {
        (word[wordLenMinusOne - innerIndex] == str[index - innerIndex]) ? (s++) : (s = 0);
        if (s == word.length) {
          return index;
        }
      }
    }
  }

  return null;
}