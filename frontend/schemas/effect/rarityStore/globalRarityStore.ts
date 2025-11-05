import * as S from '@effect/schema/Schema';

// Schema for global rarity data (individual trait rarity information)
export const GlobalRarityDataSchema = S.Struct({
  traitName: S.String,
  rarity: S.Number.pipe(S.between(0, 100)),
});

// Schema for the global rarity store state
export const GlobalRarityStateSchema = S.Struct({
  isGlobalViewActive: S.Boolean,
  lastActiveSet: S.String,
  persistedRarityData: S.Any,
});

// Full schema that combines state and any additional properties
export const GlobalRarityStoreSchema = S.extend(
  GlobalRarityStateSchema,
  S.Struct({
    // Any additional properties can be added here if needed
  })
);

// Function to create default state
export const createDefaultGlobalRarityState = () => ({
  isGlobalViewActive: false,
  lastActiveSet: 'set1',
  persistedRarityData: {},
});

// Export types derived from schemas
export type GlobalRarityData = S.Schema.Type<typeof GlobalRarityDataSchema>;
export type GlobalRarityState = S.Schema.Type<typeof GlobalRarityStateSchema>;
export type GlobalRarityStore = S.Schema.Type<typeof GlobalRarityStoreSchema>;
