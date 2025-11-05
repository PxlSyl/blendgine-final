import * as S from '@effect/schema/Schema';
import * as E from 'effect/Effect';
import { Effect } from 'effect';

/**
 * Validates data using an Effect Schema
 * Similar to the safeValidate utility for Zod
 */
export const safeValidate = <I, A>(
  schema: S.Schema<A, I>,
  data: I
): {
  success: boolean;
  data: A | null;
  errors?: string[];
} => {
  try {
    const validData = S.decodeSync(schema)(data);
    return { success: true, data: validData };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown validation error';
    return {
      success: false,
      data: null,
      errors: [errorMessage],
    };
  }
};

/**
 * Asynchronous version of the validation
 */
export const safeValidateEffectAsync = <A, I>(
  schema: S.Schema<A, I>,
  data: I
): Promise<{
  success: boolean;
  data: A | null;
  errors?: string[];
}> => {
  return Effect.runPromise(
    Effect.try({
      try: () => S.decodeSync(schema)(data),
      catch: (error) => {
        const errorMessages =
          error instanceof Error ? [error.message] : ['Unknown validation error'];
        return { success: false, data: null, errors: errorMessages };
      },
    }).pipe(Effect.map((result) => ({ success: true, data: result })))
  );
};

/**
 * Validates data using Effect and returns an Effect type
 */
export const validateWithEffect = <I, A>(
  schema: S.Schema<A, I>,
  data: I
): E.Effect<A, Error, never> => {
  return E.catchAll(S.decode(schema)(data), (error) =>
    E.fail(new Error(`Validation failed: ${error.message}`))
  );
};

/**
 * Function to get a default value from a schema
 */
export const getDefaultFromSchema = <A, I extends Record<string, unknown>>(
  schema: S.Schema<A, I>
): A => {
  try {
    // Attempts to decode an empty object, which should trigger default values
    return S.decodeSync(schema)({} as I);
  } catch (error) {
    console.error('Failed to get default value from schema:', error);
    // Returns an empty object if decoding fails
    return {} as A;
  }
};

/**
 * Creates a helper to initialize a schema with a default value factory function
 * Useful for schemas that don't have built-in default values
 */
export const schemaWithDefaults = <A, I extends Record<string, unknown>>(
  schema: S.Schema<A, I>,
  defaultFactory: () => A
): {
  schema: S.Schema<A, I>;
  getDefault: () => A;
} => {
  return {
    schema,
    getDefault: defaultFactory,
  };
};

/**
 * Helper to transform object (Record) values into a typed array
 * Useful to avoid typing errors with Object.values()
 */
export const typedObjectValues = <K extends string, V>(obj: Record<K, V>): V[] => {
  return Object.values(obj);
};
