/**
 * Utility functions for debounce and throttle to replace lodash
 */

/**
 * Type for the debounced function
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface DebouncedFunction<Args extends unknown[], Return> {
  (...args: Args): void;
  cancel: () => void;
  flush: () => void;
}

/**
 * Creates a "debounced" version of a function that will only be executed
 * after a certain period of inactivity
 *
 * @param fn - The function to "debounce"
 * @param wait - Wait time in milliseconds
 * @param options - Additional options
 * @returns A debounced function
 */
export function debounce<Args extends unknown[], Return>(
  fn: (...args: Args) => Return,
  wait = 300,
  options: { leading?: boolean; trailing?: boolean; maxWait?: number } = {}
): DebouncedFunction<Args, Return> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  let lastArgs: Args | undefined;
  let lastCallTime: number | undefined;
  let lastInvokeTime = 0;

  const { leading = false, trailing = true, maxWait = 0 } = options;
  const maxing = maxWait > 0;

  function invokeFunc(time: number): void {
    const args = lastArgs;
    lastArgs = undefined;
    lastInvokeTime = time;
    if (args) {
      fn(...args);
    }
  }

  function shouldInvoke(time: number): boolean {
    const timeSinceLastCall = time - (lastCallTime ?? 0);
    const timeSinceLastInvoke = time - lastInvokeTime;

    return (
      lastCallTime === undefined ||
      timeSinceLastCall >= wait ||
      (maxing && timeSinceLastInvoke >= maxWait)
    );
  }

  function trailingEdge(time: number): void {
    timeout = undefined;
    if (trailing && lastArgs) {
      invokeFunc(time);
    }
    lastArgs = undefined;
  }

  function leadingEdge(time: number): void {
    lastInvokeTime = time;
    timeout = setTimeout(() => trailingEdge(Date.now()), wait);
    if (leading) {
      invokeFunc(time);
    }
  }

  const debounced = function (this: unknown, ...args: Args): void {
    const time = Date.now();
    lastArgs = args;
    lastCallTime = time;

    const isInvoking = shouldInvoke(time);

    if (isInvoking) {
      if (timeout === undefined) {
        leadingEdge(time);
        return;
      }
      if (maxing) {
        timeout = setTimeout(() => trailingEdge(Date.now()), wait);
        invokeFunc(time);
        return;
      }
    }
    timeout ??= setTimeout(() => trailingEdge(Date.now()), wait);
  };

  debounced.cancel = function (): void {
    if (timeout !== undefined) {
      clearTimeout(timeout);
      timeout = undefined;
    }
    lastInvokeTime = 0;
    lastArgs = undefined;
    lastCallTime = undefined;
  };

  debounced.flush = function (): void {
    if (timeout !== undefined) {
      clearTimeout(timeout);
      timeout = undefined;
    }
    if (lastArgs) {
      invokeFunc(Date.now());
    }
  };

  return debounced;
}

/**
 * Type for the throttled function
 */
export type ThrottledFunction<Args extends unknown[], Return> = DebouncedFunction<Args, Return>;

/**
 * Creates a "throttled" version of a function that will only execute
 * at most once per specified time interval
 *
 * @param fn - The function to "throttle"
 * @param wait - Minimum interval between executions in milliseconds
 * @param options - Additional options
 * @returns A throttled function
 */
export function throttle<Args extends unknown[], Return>(
  fn: (...args: Args) => Return,
  wait = 300,
  options: { leading?: boolean; trailing?: boolean } = {}
): ThrottledFunction<Args, Return> {
  return debounce(fn, wait, {
    leading: options.leading !== false,
    trailing: options.trailing !== false,
    maxWait: wait,
  });
}
