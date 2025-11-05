import * as S from '@effect/schema/Schema';

/**
 * Schéma pour les entrées de déplacement de couche
 */
export const MoveLayerInputSchema = S.Struct({
  layerName: S.String,
  direction: S.Union(S.Literal('up'), S.Literal('down')),
  setId: S.optional(S.String),
});

/**
 * Schéma pour les entrées d'activation/désactivation de couche
 */
export const ToggleLayerInputSchema = S.Struct({
  layerName: S.String,
  setId: S.optional(S.String),
});

/**
 * Schéma pour les entrées d'activation/désactivation de trait
 */
export const ToggleTraitInputSchema = S.Struct({
  layerName: S.String,
  traitName: S.String,
  setId: S.optional(S.String),
});

/**
 * Schéma pour les entrées de définition de trait forcé
 */
export const SetForcedTraitInputSchema = S.Struct({
  layerName: S.String,
  traitName: S.String,
});

/**
 * Schéma pour les entrées de récupération d'image de couche
 */
export const GetLayerImageInputSchema = S.Struct({
  layerName: S.String,
  traitName: S.String,
});

/**
 * Types inférés des schémas
 */
export type MoveLayerInput = S.Schema.Type<typeof MoveLayerInputSchema>;
export type ToggleLayerInput = S.Schema.Type<typeof ToggleLayerInputSchema>;
export type ToggleTraitInput = S.Schema.Type<typeof ToggleTraitInputSchema>;
export type SetForcedTraitInput = S.Schema.Type<typeof SetForcedTraitInputSchema>;
export type GetLayerImageInput = S.Schema.Type<typeof GetLayerImageInputSchema>;
