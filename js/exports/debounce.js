/**
 * Creates a debounced version of a function that delays its execution 
 * until after a specified delay period has elapsed since the last time 
 * it was invoked.
 *
 * @param {Function} func - The function to debounce.
 * @param {number} delay - The number of milliseconds to delay.
 * @returns {Function} A new debounced function that, when invoked, 
 *                    will delay the execution of `func` until after 
 *                    `delay` milliseconds have passed since the last 
 *                    time it was invoked.
 *
 * @example
 * const debouncedFunction = debounceEvent(() => {
 *     console.log('Function executed!');
 * }, 200);
 *
 * // The following calls will only execute the function once, 
 * // 200 milliseconds after the last call.
 * debouncedFunction();
 * debouncedFunction();
 * debouncedFunction();
 */
export function debounceEvent(func, delay) {
  let timeoutId;
  return function (...args) {
      timeoutId && clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}
