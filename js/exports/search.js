export function searchFromEnd(str, word) {
  const wordLenMinusOne = word.length - 1;

  for (let index = str.length - 1; index > 0; index--) {
    if (str[index] === word[wordLenMinusOne]) {
      if (str.substring(index - wordLenMinusOne, index + 1) === word) {
        return index;
      }
    }
  }

  return null;
}