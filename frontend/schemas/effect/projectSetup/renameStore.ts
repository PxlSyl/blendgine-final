import * as S from '@effect/schema/Schema';

/**
 * Schéma pour les extensions de fichier autorisées
 */
export const FileExtensionSchema = S.Union(
  S.Literal('.png'),
  S.Literal('.gif'),
  S.Literal('.webp')
);

/**
 * Schéma pour les noms de couche
 */
export const LayerNameSchema = S.String;

/**
 * Schéma pour les noms de trait
 */
export const TraitNameSchema = S.String;

/**
 * Schéma pour les demandes de renommage
 */
export const RenameRequestSchema = S.Struct({
  oldName: S.String,
  newName: S.String,
  type: S.Union(S.Literal('layer'), S.Literal('trait')),
  parentLayer: S.optional(S.String),
});

/**
 * Types inférés des schémas
 */
export type FileExtension = S.Schema.Type<typeof FileExtensionSchema>;
export type LayerName = S.Schema.Type<typeof LayerNameSchema>;
export type TraitName = S.Schema.Type<typeof TraitNameSchema>;
export type RenameRequest = S.Schema.Type<typeof RenameRequestSchema>;
