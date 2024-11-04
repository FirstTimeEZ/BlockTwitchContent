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