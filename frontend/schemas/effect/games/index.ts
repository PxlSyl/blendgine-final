import * as S from '@effect/schema/Schema';

/**
 * Schéma pour les attributs de jeu avec types spécifiques pour les valeurs
 * afin d'assurer la compatibilité avec React
 */
export const GameAttributeSchema = S.Struct({
  id: S.String,
  trait_type: S.String,
  type: S.Union(S.Literal('text'), S.Literal('number'), S.Literal('array')),
  min: S.optional(S.Number),
  max: S.optional(S.Number),
  // Explicitement définir les valeurs comme des chaînes pour être compatibles avec React
  arrayValues: S.optional(S.mutable(S.Struct({}))), // Record<string, string>
  textValues: S.optional(S.mutable(S.Struct({}))), // Record<string, string>
  value: S.optional(S.Union(S.String, S.Number, S.Boolean)), // Pour la compatibilité avec les types React
  isRandomMode: S.optional(S.Boolean),
  arrayMode: S.optional(S.Union(S.Literal('multiple_arrays'), S.Literal('random_texts'))),
  arraySize: S.optional(S.Number),
});

/**
 * Schéma pour les en-têtes de jeu
 */
export const GameHeaderSchema = S.Struct({
  id: S.String,
  name: S.String,
  attributes: S.Array(GameAttributeSchema),
});

/**
 * Schéma pour l'état du store de données de jeu
 */
export const DataGamingStateSchema = S.Struct({
  headers: S.Array(GameHeaderSchema),
  isTypeOpen: S.mutable(S.Struct({})), // Record<string, boolean>
  currentTextValue: S.String,
});

/**
 * Types inférés des schémas
 */
export type GameAttribute = S.Schema.Type<typeof GameAttributeSchema>;
export type GameHeader = S.Schema.Type<typeof GameHeaderSchema>;
export type DataGamingState = S.Schema.Type<typeof DataGamingStateSchema>;

/**
 * Crée l'état par défaut pour le store de données de jeu
 */
export const createDefaultDataGamingState = (): DataGamingState => ({
  headers: [],
  isTypeOpen: {},
  currentTextValue: '',
});
