import * as S from '@effect/schema/Schema';
// Suppression de l'import circulaire
// import { RarityConfigSchema } from './index';

/**
 * Schéma pour l'état du store de combinaisons
 */
export const CombinationsStateSchema = S.Struct({
  possibleCombinations: S.Number.pipe(S.int(), S.nonNegative()),
  loading: S.Boolean,
  error: S.optional(S.String),
});

/**
 * Schéma pour les entrées de calcul de combinaisons - utilise S.Record pour éviter la dépendance circulaire
 */
export const CalculateCombinationsInputSchema = S.Struct({
  // Utilise un Record générique au lieu du schéma spécifique pour éviter la dépendance circulaire
  rarityConfig: S.Record({ key: S.String, value: S.Unknown }),
  activeSetId: S.String,
});

/**
 * Type inféré du schéma CombinationsState
 */
export type CombinationsState = S.Schema.Type<typeof CombinationsStateSchema>;

/**
 * Type inféré du schéma CalculateCombinationsInput
 */
export type CalculateCombinationsInput = S.Schema.Type<typeof CalculateCombinationsInputSchema>;

/**
 * Créer l'état par défaut pour le store de combinaisons
 */
export const createDefaultCombinationsState = (): CombinationsState => ({
  possibleCombinations: 0,
  loading: false,
  error: undefined,
});
