export {
  IncompatibilityStateSchema,
  createDefaultIncompatibilityState,
} from './incompatibilitiesStore';

// Re-exporting the type correctly
export type { IncompatibilityState } from './incompatibilitiesStore';

// Définition du ForcedCombinationStateSchema
import * as S from '@effect/schema/Schema';
import { ForcedCombinationsBySetSchema, ForcedCombinationSelectorTypeSchema } from '../layerOrder';

export const ForcedCombinationStateSchema = S.Struct({
  forcedCombinationsBySets: ForcedCombinationsBySetSchema,
  forcedCombinationSelectors: S.Array(ForcedCombinationSelectorTypeSchema),
  activeSet: S.String,
  availableSets: S.Array(S.Number),
});

// Type inféré
export type ForcedCombinationState = S.Schema.Type<typeof ForcedCombinationStateSchema>;

// Helper function to create default state
export const createDefaultForcedCombinationState = () => ({
  forcedCombinationsBySets: {},
  forcedCombinationSelectors: [],
  activeSet: 'set1',
  availableSets: [1],
});

// Define RulesMode schema
export const RulesModeSchema = S.Union(S.Literal('incompatibilities'), S.Literal('forced'));

// Type inféré
export type RulesMode = S.Schema.Type<typeof RulesModeSchema>;

// Define RulesState schema
export const RulesStateSchema = S.mutable(
  S.Struct({
    initialMode: S.optional(RulesModeSchema),
    isWindowOpen: S.Boolean,
    activeMode: RulesModeSchema,
  })
);

// Type inféré
export type RulesState = S.Schema.Type<typeof RulesStateSchema>;

// Helper function to create default RulesState
export const createDefaultRulesState = () => ({
  isWindowOpen: false,
  activeMode: 'incompatibilities' as const,
});
