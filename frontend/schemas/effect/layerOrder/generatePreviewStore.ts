import * as S from '@effect/schema/Schema';
// Suppression de l'import circulaire
// import { LayerImageSchema } from './index';

// Définir LayerImageSchema localement pour éviter la dépendance circulaire
const LocalLayerImageSchema = S.mutable(
  S.Struct({
    name: S.String,
    path: S.String,
    dimensions: S.optional(
      S.Struct({
        width: S.Number.pipe(S.int(), S.nonNegative()),
        height: S.Number.pipe(S.int(), S.nonNegative()),
      })
    ),
  })
);

/**
 * Schéma pour les données d'image de couche utilisées dans l'aperçu de génération
 */
export const GeneratePreviewLayerImageDataSchema = S.Struct({
  image: S.optional(LocalLayerImageSchema),
  isLoading: S.Boolean,
  error: S.optional(S.String),
  url: S.optional(S.String),
});

/**
 * Schéma pour l'état du store d'aperçu de génération
 */
export const GeneratePreviewStateSchema = S.Struct({
  layerImages: S.Struct({}), // Ici, on utilise un Struct vide pour éviter les problèmes de Record
  isLoading: S.Boolean,
  error: S.optional(S.String),
  previewComplete: S.Boolean,
  isGenerating: S.Boolean,
  imageCache: S.Struct({}),
});

/**
 * Type inféré du schéma GeneratePreviewLayerImageData
 */
export type GeneratePreviewLayerImageData = S.Schema.Type<
  typeof GeneratePreviewLayerImageDataSchema
>;

/**
 * Type inféré du schéma GeneratePreviewState
 */
export type GeneratePreviewState = S.Schema.Type<typeof GeneratePreviewStateSchema>;

/**
 * Créer l'état par défaut pour le store d'aperçu de génération
 */
export const createDefaultGeneratePreviewState = (): GeneratePreviewState => ({
  layerImages: {},
  isLoading: false,
  error: undefined,
  previewComplete: false,
  isGenerating: false,
  imageCache: {},
});
