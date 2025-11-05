import * as S from '@effect/schema/Schema';
import { IncompatibilitiesBySetSchema, IncompatibilitySelectorTypeSchema } from '../layerOrder';

export const IncompatibilityStateSchema = S.mutable(
  S.Struct({
    incompatibilitiesBySets: IncompatibilitiesBySetSchema,
    incompatibilitySelectors: S.Array(IncompatibilitySelectorTypeSchema),
    activeSet: S.String,
    availableSets: S.Array(S.Number),
  })
);

// Helper function to create default state
export const createDefaultIncompatibilityState = () => ({
  incompatibilitiesBySets: {},
  incompatibilitySelectors: [],
  activeSet: 'set1',
  availableSets: [1],
});

export type IncompatibilityState = S.Schema.Type<typeof IncompatibilityStateSchema>;
