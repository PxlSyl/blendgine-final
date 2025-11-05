import * as E from 'effect/Effect';
import { pipe } from 'effect/Function';

/**
 * Utility type that allows using either an Effect, a Promise,
 * or a function that returns one of the two
 */
export type EffectOrPromise<Result, ErrorType = Error> =
  | Promise<Result>
  | E.Effect<Result, ErrorType, never>
  | ((...args: unknown[]) => Promise<Result> | E.Effect<Result, ErrorType, never>);

/**
 * Converts an effect to a promise with error handling.
 *
 * @param effect - The effect to convert
 * @returns A promise that resolves or rejects based on the effect's result
 */
export const effectToPromise = <Result, ErrorType>(
  effect: E.Effect<Result, ErrorType, never>
): Promise<Result> => {
  return E.runPromise(
    pipe(
      effect,
      E.mapError((error) => {
        if (error instanceof Error) {
          return error;
        }
        return new Error(String(error));
      })
    )
  );
};

/**
 * Converts a function returning an Effect to a function returning a Promise
 *
 * This utility is useful for adapting existing functions that return
 * an Effect to functions that return a Promise, facilitating integration
 * with existing Promise-based code.
 *
 * @param fn - The function that returns an Effect
 * @returns A new function that returns a Promise
 */
export function effectFnToPromiseFn<Args extends unknown[], Result, ErrorType>(
  fn: (...args: Args) => E.Effect<Result, ErrorType, never>
): (...args: Args) => Promise<Result> {
  return (...args: Args) => effectToPromise(fn(...args));
}

/**
 * Converts any EffectOrPromise to an Effect
 *
 * This function standardizes the handling of functions that can
 * return either Effects, Promises, or functions returning one of the two.
 *
 * @param input - The EffectOrPromise to convert
 * @returns A standardized Effect
 */
export function toEffect<Result, ErrorType = Error>(
  input: EffectOrPromise<Result, ErrorType>
): E.Effect<Result, ErrorType, never> {
  // If it's a Promise
  if (input instanceof Promise) {
    return E.tryPromise({
      try: () => input,
      catch: (error) => error as ErrorType,
    });
  }

  // If it's a function
  if (typeof input === 'function') {
    const fn = input as (
      ...args: unknown[]
    ) => Promise<Result> | E.Effect<Result, ErrorType, never>;

    return E.flatMap(
      E.try({
        try: () => fn(),
        catch: (error) => error as ErrorType,
      }),
      (result) => {
        // If the result is a Promise
        if (result instanceof Promise) {
          return E.tryPromise({
            try: () => result,
            catch: (error) => error as ErrorType,
          });
        }

        // If the result is an Effect
        return result;
      }
    );
  }

  // It's already an Effect
  return input;
}

/**
 * Converts any EffectOrPromise to a Promise
 *
 * This function standardizes the handling of functions that can
 * return either Effects, Promises, or functions returning one of the two.
 *
 * @param input - The EffectOrPromise to convert
 * @returns A standardized Promise
 */
export function toPromise<Result>(input: EffectOrPromise<Result>): Promise<Result> {
  // If it's already a Promise
  if (input instanceof Promise) {
    return input;
  }

  // If it's a function
  if (typeof input === 'function') {
    const fn = input as (...args: unknown[]) => Promise<Result> | E.Effect<Result, Error, never>;
    const result = fn();

    // If the result is a Promise
    if (result instanceof Promise) {
      return result;
    }

    // If the result is an Effect
    return effectToPromise(result);
  }

  // It's an Effect
  return effectToPromise(input);
}

/**
 * Converts an effect to a promise with a structured result.
 */
export const effectToStructuredPromise = <Result, ErrorType>(
  effect: E.Effect<Result, ErrorType, never>
): Promise<{ success: boolean; value?: Result; error?: ErrorType }> => {
  return E.runPromise(
    E.match(effect, {
      onFailure: (error) => ({ success: false, error }),
      onSuccess: (value) => ({ success: true, value }),
    })
  );
};

/**
 * Wraps a promise in an effect with error handling.
 */
export const tryPromise = <Result>(
  promiseFn: () => Promise<Result>
): E.Effect<Result, Error, never> => {
  return E.tryPromise({
    try: promiseFn,
    catch: (error) =>
      error instanceof Error ? error : new Error(`Promise error: ${String(error)}`),
  });
};

/**
 * Creates an adapter for functions requiring a strict Promise
 *
 * This function takes a function that returns an EffectOrPromise and returns
 * a new function guaranteeing the return of a Promise with all its properties
 * (then, catch, finally, etc.), even if the original function returns an Effect.
 *
 * Useful for interoperability with APIs that strictly check for Promise type.
 *
 * @param fn - The function that returns an EffectOrPromise
 * @returns A new function that guarantees the return of a Promise
 */
export function asPromiseFn<Args extends unknown[], Result>(
  fn: (...args: Args) => EffectOrPromise<Result>
): (...args: Args) => Promise<Result> {
  return (...args: Args) => {
    const result = fn(...args);
    return toPromise(result);
  };
}
