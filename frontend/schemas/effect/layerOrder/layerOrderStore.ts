import * as S from '@effect/schema/Schema';
// Supprimer tous les imports circulaires
// import { ExpandedLayersSchema } from '.';

// Définir SetInfoSchema localement pour éviter la dépendance circulaire
const LocalSetInfoSchema = S.mutable(
  S.Struct({
    id: S.String,
    name: S.String,
    customName: S.optional(S.String),
    createdAt: S.String,
    layers: S.mutable(S.Array(S.String)),
    nftCount: S.Number,
  })
);

// Définir un schéma RarityConfig générique localement pour éviter la dépendance circulaire
const LocalRarityConfigSchema = S.Record({ key: S.String, value: S.Any });

// Définir un schéma ExpandedLayers localement pour éviter la dépendance circulaire
const LocalExpandedLayersSchema = S.mutable(
  S.Record({
    key: S.String,
    value: S.mutable(S.Record({ key: S.String, value: S.Boolean })),
  })
);

/**
 * Schéma pour l'état complet du store layerOrder
 * Combine l'état de base avec l'état des combinaisons
 */
export const LayerOrderStoreStateSchema = S.Struct({
  sets: S.Record({ key: S.String, value: LocalSetInfoSchema }),
  activeSetId: S.String,
  layerImages: S.Record({ key: S.String, value: S.Any }),
  rarityConfig: LocalRarityConfigSchema,
  expandedLayers: LocalExpandedLayersSchema,
  forcedTraits: S.Record({ key: S.String, value: S.Record({ key: S.String, value: S.String }) }),
  combinations: S.Struct({
    loading: S.Boolean,
    possibleCombinations: S.Number,
  }),
  loading: S.Boolean,
});

/**
 * Type inféré du schéma LayerOrderStoreState
 */
export type LayerOrderStoreState = S.Schema.Type<typeof LayerOrderStoreStateSchema>;

/**
 * Crée l'état par défaut pour le store layerOrder
 */
export const createDefaultLayerOrderStoreState = () => {
  const defaultSetId = 'set1';
  const defaultSetInfo = {
    id: defaultSetId,
    name: 'Set 1',
    customName: 'Set 1', // Make sure customName is a string and never undefined
    createdAt: new Date().toISOString(),
    layers: [],
    nftCount: 10,
  };

  return {
    sets: {
      [defaultSetId]: defaultSetInfo,
    },
    activeSetId: defaultSetId,
    layerImages: {},
    rarityConfig: {},
    expandedLayers: {
      [defaultSetId]: {},
    },
    forcedTraits: {
      [defaultSetId]: {},
    },
    combinations: {
      loading: false,
      possibleCombinations: 0,
    },
    loading: false,
  };
};
