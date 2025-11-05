import * as Effect from 'effect/Effect';

/**
 * Memoization function similar to lodash.memoize, but with enhanced features
 *
 * This function creates a memoized version of a function and stores results
 * to avoid repetitive calculations. It also offers advanced options
 * such as TTL (time-to-live) configuration.
 *
 * @param fn - The function to memoize
 * @param keyResolver - Optional function to extract cache key from arguments
 * @param options - Cache configuration options
 * @returns A memoized version of the input function
 */
export function memoize<Args extends unknown[], Result>(
  fn: (...args: Args) => Result,
  keyResolver?: (...args: Args) => string,
  options?: {
    /**
     * Time-to-live for cache entries in milliseconds
     * Default: infinite
     */
    ttl?: number;
    /**
     * Maximum cache size
     * Default: Infinity
     */
    capacity?: number;
  }
): (...args: Args) => Result {
  // Cache to store computed results
  const cache = new Map<string, { value: Result; timestamp: number }>();

  // Configuration
  const ttl = options?.ttl ?? Infinity;
  const capacity = options?.capacity ?? Infinity;

  return (...args: Args): Result => {
    // Determine cache key
    const key = keyResolver ? keyResolver(...args) : JSON.stringify(args);
    const now = Date.now();

    // Check if result is in cache and hasn't expired
    const cached = cache.get(key);
    if (cached && (ttl === Infinity || now - cached.timestamp < ttl)) {
      return cached.value;
    }

    // Compute result
    const result = fn(...args);

    // Handle cache size if necessary
    if (cache.size >= capacity) {
      // Simple strategy: remove oldest entry
      const oldestKey = cache.keys().next().value;
      if (oldestKey) {
        cache.delete(oldestKey);
      }
    }

    // Store result in cache
    cache.set(key, { value: result, timestamp: now });

    return result;
  };
}

/**
 * Simplified version for synchronous functions without additional options
 */
export function memoizeSimple<Args extends unknown[], Result>(
  fn: (...args: Args) => Result
): (...args: Args) => Result {
  const cache = new Map<string, Result>();

  return (...args: Args): Result => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      const cached = cache.get(key);
      if (cached !== undefined) {
        return cached;
      }
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
}

/**
 * Memoization for Effect-based functions
 */
export function memoizeEffect<Args extends unknown[], Result, Error>(
  fn: (...args: Args) => Effect.Effect<Result, Error, never>,
  keyResolver: (...args: Args) => string = (...args) => JSON.stringify(args)
): (...args: Args) => Effect.Effect<Result, Error, never> {
  const cache = new Map<string, Effect.Effect<Result, Error, never>>();

  return (...args: Args): Effect.Effect<Result, Error, never> => {
    const key = keyResolver(...args);

    if (!cache.has(key)) {
      cache.set(key, fn(...args));
    }

    const cached = cache.get(key);
    if (cached !== undefined) {
      return cached;
    }

    // This should never happen due to the logic above, but TypeScript needs this
    return fn(...args);
  };
}
