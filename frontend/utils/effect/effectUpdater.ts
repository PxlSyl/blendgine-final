/**
 * Updates state using an effect-based approach with getter and setter functions.
 * This utility ensures type safety when updating state in a functional way.
 *
 * @param get - Function to get the current state
 * @param set - Function to update the state
 * @param updater - Function that computes the new state based on the current state
 */
export const effectUpdate = <State>(
  get: () => State,
  set: (state: Partial<State>) => void,
  updater: (state: State) => Partial<State> | State
) => {
  const newState = updater(get());
  set(newState);
};

/**
 * Performs an immutable update of an object with new properties.
 * This utility ensures type safety when updating object properties.
 *
 * @param obj - The object to update
 * @param updates - The new properties to merge
 * @returns A new object with the updated properties
 */
export const updateObject = <T extends Record<string, unknown>>(obj: T, updates: Partial<T>): T => {
  return { ...obj, ...updates } as T;
};
