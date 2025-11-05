import * as S from '@effect/schema/Schema';
import { BLEND_MODES } from '../../../types/blendModes';
import {
  SolanaMetadataConfigSchema,
  AnimationQualityConfigSchema,
  ResizeConfigSchema,
} from '../metadataSchemas';

/**
 * Schéma pour les propriétés de fusion (blend properties)
 * Utilisé dans plusieurs composants et schémas liés aux layers et previews
 */
export const BlendPropertiesSchema = S.Struct({
  mode: S.Enums(BLEND_MODES),
  opacity: S.Number.pipe(S.between(0, 100)),
});

/**
 * Type inféré du schéma BlendProperties
 */
export type BlendProperties = S.Schema.Type<typeof BlendPropertiesSchema>;

/**
 * Schéma pour les dimensions
 */
export const DimensionsSchema = S.Struct({
  width: S.Number.pipe(S.int(), S.nonNegative()),
  height: S.Number.pipe(S.int(), S.nonNegative()),
});

/**
 * Type inféré du schéma Dimensions
 */
export type Dimensions = S.Schema.Type<typeof DimensionsSchema>;

/**
 * Schéma pour les entrées d'image
 */
export const ImageEntrySchema = S.Struct({
  src: S.Union(S.String, S.Null),
  originalSrc: S.optional(S.Union(S.String, S.Null)),
  blend: BlendPropertiesSchema,
  blendedResult: S.optional(S.String),
  dimensions: S.optional(DimensionsSchema),
});

/**
 * Type inféré du schéma ImageEntry
 */
export type ImageEntry = S.Schema.Type<typeof ImageEntrySchema>;

/**
 * Schéma pour les informations d'image individuelle
 */
export const ImageInfoSchema = S.Struct({
  name: S.String,
  frame_count: S.optional(S.Number.pipe(S.int(), S.nonNegative())),
  is_single_frame: S.optional(S.Boolean),
});

/**
 * Type inféré du schéma ImageInfo
 */
export type ImageInfo = S.Schema.Type<typeof ImageInfoSchema>;

/**
 * Schéma pour les images de couche
 */
export const LayerImagesSchema = S.Struct({
  layerName: S.String,
  imageNames: S.Array(S.String),
  imageInfos: S.optional(S.Array(ImageInfoSchema)),
  blendProperties: S.Record({ key: S.String, value: BlendPropertiesSchema }),
  hasAnimatedImages: S.optional(S.Boolean),
  framesProcessed: S.optional(S.Boolean),
});

/**
 * Type inféré du schéma LayerImages
 */
export type LayerImages = S.Schema.Type<typeof LayerImagesSchema>;

/**
 * Schéma pour l'état d'aperçu de couche
 */
export const LayerPreviewStateSchema = S.Struct({
  layerImages: S.Array(LayerImagesSchema),
  expandedLayer: S.Array(S.String),
  loadedImages: S.Record({ key: S.String, value: ImageEntrySchema }),
  loadingStates: S.Record({ key: S.String, value: S.Boolean }),
  imageCounts: S.Record({ key: S.String, value: S.Number }),
  projectId: S.String,
  lastUpdate: S.optional(S.Number),
});

/**
 * Type inféré du schéma LayerPreviewState
 */
export type LayerPreviewState = S.Schema.Type<typeof LayerPreviewStateSchema>;

/**
 * Schéma pour les informations d'image de couche
 */
export const LayerImageInfoSchema = S.Struct({
  path: S.String,
  name: S.String,
  dimensions: S.optional(DimensionsSchema),
});

/**
 * Type inféré du schéma LayerImageInfo
 */
export type LayerImageInfo = S.Schema.Type<typeof LayerImageInfoSchema>;

/**
 * Schéma pour les données d'aperçu de couche
 */
export const LayerPreviewDataSchema = S.Struct({
  layerName: S.String,
  traitName: S.String,
  imageData: S.optional(S.String),
});

/**
 * Schéma pour l'état persistant de la configuration des images
 */
export const ImageSetupPersistentStateSchema = S.Struct({
  imageFormat: S.String,
  baseWidth: S.Number,
  baseHeight: S.Number,
  finalWidth: S.Number,
  finalHeight: S.Number,
  fixedProportion: S.Boolean,
  includeSpritesheets: S.Boolean,
  allowDuplicates: S.Boolean,
  shuffleSets: S.Boolean,
  blockchain: S.Union(S.Literal('eth'), S.Literal('sol')),
  solanaConfig: S.optional(SolanaMetadataConfigSchema),
  animationQuality: S.optional(AnimationQualityConfigSchema),
  resizeConfig: S.optional(ResizeConfigSchema),
});

/**
 * Schéma pour l'état de la configuration des images
 */
export const ImageSetupStateSchema = S.Struct({
  // Properties from ImageSetupPersistentStateSchema
  imageFormat: S.String,
  baseWidth: S.Number,
  baseHeight: S.Number,
  finalWidth: S.Number,
  finalHeight: S.Number,
  fixedProportion: S.Boolean,
  includeSpritesheets: S.Boolean,
  allowDuplicates: S.Boolean,
  shuffleSets: S.Boolean,
  blockchain: S.Union(S.Literal('eth'), S.Literal('sol')),
  solanaConfig: S.optional(SolanaMetadataConfigSchema),
  animationQuality: S.optional(AnimationQualityConfigSchema),
  resizeConfig: S.optional(ResizeConfigSchema),

  // Additional properties for the full state
  isLoading: S.optional(S.Boolean),
  error: S.optional(S.String),
  isFormatOpen: S.optional(S.Boolean),
  errorMessage: S.optional(S.Union(S.Null, S.String)),
  selectedFormat: S.String,
  isGenerateDisabled: S.optional(S.Boolean),
  imageFormats: S.mutable(S.Array(S.String)),
  blockchains: S.mutable(S.Array(S.Union(S.Literal('eth'), S.Literal('sol')))),
});

/**
 * Schéma pour les propriétés de fusion (blend) dans les aperçus (previews)
 */
export const PreviewBlendPropertiesSchema = S.Struct({
  mode: S.Enums(BLEND_MODES),
  opacity: S.Number.pipe(S.between(0, 100)),
});

/**
 * Type inféré du schéma PreviewBlendProperties
 */
export type PreviewBlendProperties = S.Schema.Type<typeof PreviewBlendPropertiesSchema>;

export type LayerPreviewData = S.Schema.Type<typeof LayerPreviewDataSchema>;

export type ImageSetupPersistentState = S.Schema.Type<typeof ImageSetupPersistentStateSchema>;

export type ImageSetupState = S.Schema.Type<typeof ImageSetupStateSchema>;

/**
 * Schéma pour la liste des noms d'images
 */
export const ImageNameListSchema = S.Array(S.String);

export type ImageNameList = S.Schema.Type<typeof ImageNameListSchema>;
