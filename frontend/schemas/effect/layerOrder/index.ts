import * as S from '@effect/schema/Schema';
import { BlendPropertiesSchema } from '../projectSetup/previews';
import {
  SolanaMetadataConfigSchema,
  AnimationQualityConfigSchema,
  ResizeConfigSchema,
} from '../metadataSchemas';

// Schema for blend properties
export { BlendPropertiesSchema } from '../projectSetup/previews';

// Schema for image dimensions
export const ImageDimensionsSchema = S.mutable(
  S.Struct({
    width: S.Number.pipe(S.int(), S.nonNegative()),
    height: S.Number.pipe(S.int(), S.nonNegative()),
  })
);

// Schema for layer image
export const LayerImageSchema = S.mutable(
  S.Struct({
    name: S.String,
    path: S.String,
    dimensions: S.optional(ImageDimensionsSchema),
    frame_count: S.optional(S.Number.pipe(S.int(), S.nonNegative())),
    is_single_frame: S.optional(S.Boolean),
  })
);

// Schema for layer data
export const LayerDataSchema = S.mutable(
  S.Struct({
    name: S.String,
    images: S.Array(LayerImageSchema),
    base_dimensions: ImageDimensionsSchema,
    has_animated_images: S.Boolean,
  })
);

// Schema for spritesheet layout
export const SpritesheetLayoutSchema = S.mutable(
  S.Struct({
    rows: S.Number.pipe(S.int(), S.nonNegative()),
    cols: S.Number.pipe(S.int(), S.nonNegative()),
    frameWidth: S.Number.pipe(S.int(), S.nonNegative()),
    frameHeight: S.Number.pipe(S.int(), S.nonNegative()),
    totalSheets: S.Number.pipe(S.int(), S.nonNegative()),
    framesPerSheet: S.Number.pipe(S.int(), S.nonNegative()),
    totalFrames: S.Number.pipe(S.int(), S.nonNegative()),
  })
);

// Schema for initial folder data
export const InitialFolderDataSchema = S.mutable(
  S.Struct({
    folder_path: S.String,
    layers: S.Array(LayerDataSchema),
    base_dimensions: ImageDimensionsSchema,
    is_animated_collection: S.Boolean,
    frame_count: S.Number.pipe(S.int(), S.nonNegative()),
    spritesheet_layout: S.optional(SpritesheetLayoutSchema),
  })
);

// Schema for layer image data
export const LayerImageDataSchema = S.mutable(
  S.Struct({
    width: S.Number.pipe(S.int(), S.nonNegative()),
    height: S.Number.pipe(S.int(), S.nonNegative()),
    url: S.String,
    path: S.optional(S.String),
    blend: S.optional(BlendPropertiesSchema),
  })
);

// Schema for SetOrderedLayersArg union type
export const SetOrderedLayersArgSchema = S.mutable(
  S.Union(
    S.mutable(S.Array(S.String)),
    S.mutable(
      S.Struct({
        layers: S.mutable(S.Array(S.String)),
        nftCount: S.Number.pipe(S.int(), S.positive()),
      })
    )
  )
);

// Schema for current traits structure
export const CurrentTraitsSchema = S.mutable(S.Record({ key: S.String, value: S.String }));

// Schema for expanded layers (which layers are expanded in the UI)
export const ExpandedLayersSchema = S.mutable(
  S.Record({
    key: S.String,
    value: S.mutable(S.Record({ key: S.String, value: S.Boolean })),
  })
);

// Schema for forced traits
export const ForcedTraitsSchema = S.mutable(
  S.Record({
    key: S.String,
    value: S.mutable(S.Record({ key: S.String, value: S.String })),
  })
);

// Schema for set config
export const SetConfigSchema = S.mutable(
  S.Struct({
    blend: BlendPropertiesSchema,
    zIndex: S.Number,
    enabled: S.Boolean,
    value: S.Number,
    locked: S.optional(S.Boolean),
    includeInMetadata: S.optional(S.Boolean),
  })
);

// Schema for layer set config
export const LayerSetConfigSchema = S.mutable(
  S.Struct({
    active: S.Boolean,
    locked: S.optional(S.Boolean),
    includeInMetadata: S.optional(S.Boolean),
  })
);

// Schema for trait set config
export const TraitSetConfigSchema = S.mutable(
  S.Struct({
    enabled: S.Boolean,
    value: S.Number.pipe(S.between(0, 100)),
    blend: S.Struct({
      mode: S.String,
      opacity: S.Number.pipe(S.between(0, 100)),
    }),
    zIndex: S.Number.pipe(S.int()),
    includeInMetadata: S.optional(S.Boolean),
    locked: S.optional(S.Boolean),
  })
);

// Schema for trait config (for individual traits in a layer)
export const TraitConfigSchema = S.mutable(
  S.Struct({
    sets: S.mutable(S.Record({ key: S.String, value: TraitSetConfigSchema })),
  })
);

// Schema for layer config
export const LayerConfigSchema = S.mutable(
  S.Struct({
    sets: S.optional(S.mutable(S.Record({ key: S.String, value: LayerSetConfigSchema }))),
    traits: S.optional(S.mutable(S.Record({ key: S.String, value: TraitConfigSchema }))),
    defaultBlend: S.optional(BlendPropertiesSchema),
    locked: S.optional(S.Boolean),
  })
);

// Schema for ordered layers set
export const OrderedLayersSetSchema = S.mutable(
  S.Struct({
    id: S.String,
    name: S.String,
    customName: S.optional(S.String),
    createdAt: S.String,
    layers: S.mutable(S.Array(S.String)),
    nftCount: S.Number.pipe(S.int(), S.nonNegative()),
  })
);

// Schema for ordered layers sets
export const OrderedLayersSetsSchema = S.mutable(
  S.Record({
    key: S.String,
    value: OrderedLayersSetSchema,
  })
);

// Schema for rarity config
export const RarityConfigSchema = S.mutable(
  S.Record({
    key: S.String,
    value: LayerConfigSchema,
  })
);

// Schema for set order
export const SetOrderSchema = S.mutable(
  S.Struct({
    id: S.String,
    order: S.Number.pipe(S.int(), S.nonNegative()),
  })
);

// Schema for set orders array
export const SetOrdersSchema = S.mutable(S.Array(SetOrderSchema));

// Schema for the main layer order state
export const LayerOrderStateSchema = S.mutable(
  S.Struct({
    layerImages: S.mutable(S.Record({ key: S.String, value: LayerImageDataSchema })),
    currentTraits: CurrentTraitsSchema,
    possibleCombinations: S.Number.pipe(S.int(), S.nonNegative()),
    activeSetId: S.Union(S.String, S.Null),
    sets: OrderedLayersSetsSchema,
    setOrders: SetOrdersSchema,
    expandedLayers: ExpandedLayersSchema,
    forcedTraits: ForcedTraitsSchema,
    rarityConfig: RarityConfigSchema,
  })
);

// Schema for generated image
export const GeneratedImageSchema = S.mutable(
  S.Struct({
    id: S.optional(S.String),
    url: S.String,
    name: S.String,
    traits: S.mutable(S.Record({ key: S.String, value: S.Unknown })),
    sequenceNumber: S.Number,
  })
);

// Schema for console message
export const ConsoleMessageSchema = S.mutable(
  S.Struct({
    id: S.String,
    type: S.Union(
      S.Literal('info'),
      S.Literal('success'),
      S.Literal('error'),
      S.Literal('warning')
    ),
    message: S.String,
    timestamp: S.String,
    sequenceNumber: S.Number,
  })
);

// Schema for incompatibilities
export const IncompatibilitiesSchema = S.mutable(S.Record({ key: S.String, value: S.Unknown }));

// Schema for incompatibilities by sets
export const IncompatibilitiesBySetSchema = S.mutable(
  S.Record({ key: S.String, value: S.Unknown })
);

// Schema for forced combinations
export const ForcedCombinationsSchema = S.mutable(S.Record({ key: S.String, value: S.Unknown }));

// Schema for forced combinations by sets
export const ForcedCombinationsBySetSchema = S.mutable(
  S.Record({ key: S.String, value: S.Unknown })
);

// Schema for UpdateRarityAction
export const UpdateRarityActionSchema = S.Union(
  S.Struct({
    field: S.Literal('value'),
    value: S.Union(
      S.Number,
      S.Union(
        S.Literal('increase'),
        S.Literal('decrease'),
        S.Literal('setMin'),
        S.Literal('setMax')
      )
    ),
  }),
  S.Struct({
    field: S.Literal('enabled'),
    value: S.Boolean,
  })
);

// Schema for NFT generation args
export const NFTGenerationArgsSchema = S.Struct({
  inputFolder: S.String,
  exportFolder: S.String,
  collectionName: S.String,
  collectionDescription: S.String,
  includeRarity: S.Boolean,
  orderedLayersSets: S.optional(OrderedLayersSetsSchema),
  rarityConfig: S.optional(RarityConfigSchema),
  baseWidth: S.Number,
  baseHeight: S.Number,
  finalWidth: S.Number,
  finalHeight: S.Number,
  imageFormat: S.String,
  incompatibilitiesBySets: S.optional(IncompatibilitiesBySetSchema),
  forcedCombinationsBySets: S.optional(ForcedCombinationsBySetSchema),
  allowDuplicates: S.Boolean,
  shuffleSets: S.Boolean,
  blockchain: S.Union(S.Literal('eth'), S.Literal('sol')),
  solanaConfig: S.optional(SolanaMetadataConfigSchema),
  isAnimatedCollection: S.Boolean,
  includeSpritesheets: S.Boolean,
  totalFramesCount: S.optional(S.Number),
  fps: S.optional(S.Number),
  animationQuality: S.optional(AnimationQualityConfigSchema),
  resizeConfig: S.optional(ResizeConfigSchema),
  spritesheetLayout: S.optional(SpritesheetLayoutSchema),
});

// Schema for incompatibility side
export const IncompatibilitySideSchema = S.Union(S.Literal('first'), S.Literal('second'));

// Schema for forced combination side
export const ForcedCombinationSideSchema = S.Union(S.Literal('first'), S.Literal('second'));

// Schema for incompatibility selector
export const IncompatibilitySelectorTypeSchema = S.Struct({
  id: S.Number,
  firstCategory: S.String,
  firstItem: S.String,
  secondCategory: S.String,
  secondItem: S.String,
});

// Schema for forced combination selector
export const ForcedCombinationSelectorTypeSchema = S.Struct({
  id: S.Number,
  firstCategory: S.String,
  firstItem: S.String,
  secondCategory: S.String,
  secondItem: S.String,
  rarity: S.optional(S.Number),
});

// Schema for frame data
export const FrameDataSchema = S.Struct({
  data: S.String, // path
  delay: S.Number,
  width: S.Number,
  height: S.Number,
});

// Schema for image frames
export const ImageFramesSchema = S.mutable(
  S.Struct({
    frames: S.Array(FrameDataSchema),
    originalPath: S.String,
    isAnimated: S.Boolean,
  })
);

// Schema for preferences
export const PreferencesSchema = S.Struct({
  dark_mode: S.Boolean,
  showTooltips: S.optional(S.Boolean),
  theme_name: S.optional(
    S.Union(
      S.Literal('thelab'),
      S.Literal('fresh'),
      S.Literal('sunset'),
      S.Literal('forest'),
      S.Literal('sky'),
      S.Literal('neon'),
      S.Literal('mono'),
      S.Literal('prism'),
      S.Literal('desert'),
      S.Literal('coral')
    )
  ),
});

// Schema for Tab type
export const TabSchema = S.Union(S.Literal('generate'), S.Literal('update'));

// Schema for set info
export const SetInfoSchema = S.mutable(
  S.Struct({
    id: S.String,
    name: S.String,
    customName: S.optional(S.String),
    createdAt: S.String,
    layers: S.mutable(S.Array(S.String)),
    nftCount: S.Number,
  })
);

// Export types
export type LayerConfig = S.Schema.Type<typeof LayerConfigSchema>;
export type RarityConfig = S.Schema.Type<typeof RarityConfigSchema>;
export type LayerOrderState = S.Schema.Type<typeof LayerOrderStateSchema>;
export type ImageDimensions = S.Schema.Type<typeof ImageDimensionsSchema>;
export type LayerImage = S.Schema.Type<typeof LayerImageSchema>;
export type LayerData = S.Schema.Type<typeof LayerDataSchema>;
export type SpritesheetLayout = S.Schema.Type<typeof SpritesheetLayoutSchema>;
export type InitialFolderData = S.Schema.Type<typeof InitialFolderDataSchema>;
export type LayerImageData = S.Schema.Type<typeof LayerImageDataSchema>;
export type SetOrderedLayersArg = S.Schema.Type<typeof SetOrderedLayersArgSchema>;
export type SetConfig = S.Schema.Type<typeof SetConfigSchema>;
export type LayerSetConfig = S.Schema.Type<typeof LayerSetConfigSchema>;
export type TraitSetConfig = S.Schema.Type<typeof TraitSetConfigSchema>;
// Re-export types from shared metadata schemas
export type {
  InterpolationMethod,
  AnimationInterpolationSettings,
  WebPSettings,
  GIFSettings,
  MP4Settings,
  WebMSettings,
  ResizeFilter,
  ResizeAlgorithm,
  ResizeConfig,
  AnimationQualityConfig,
  SolanaCreator,
  SolanaMetadataConfig,
} from '../metadataSchemas';
export type GeneratedImage = S.Schema.Type<typeof GeneratedImageSchema>;
export type ConsoleMessage = S.Schema.Type<typeof ConsoleMessageSchema>;
export type Incompatibilities = S.Schema.Type<typeof IncompatibilitiesSchema>;
export type IncompatibilitiesBySets = S.Schema.Type<typeof IncompatibilitiesBySetSchema>;
export type ForcedCombinations = S.Schema.Type<typeof ForcedCombinationsSchema>;
export type ForcedCombinationsBySets = S.Schema.Type<typeof ForcedCombinationsBySetSchema>;
export type UpdateRarityAction = S.Schema.Type<typeof UpdateRarityActionSchema>;
export type NFTGenerationArgs = S.Schema.Type<typeof NFTGenerationArgsSchema>;
export type IncompatibilitySide = S.Schema.Type<typeof IncompatibilitySideSchema>;
export type ForcedCombinationSide = S.Schema.Type<typeof ForcedCombinationSideSchema>;
export type IncompatibilitySelectorType = S.Schema.Type<typeof IncompatibilitySelectorTypeSchema>;
export type ForcedCombinationSelectorType = S.Schema.Type<
  typeof ForcedCombinationSelectorTypeSchema
>;
export type FrameData = S.Schema.Type<typeof FrameDataSchema>;
export type ImageFrames = S.Schema.Type<typeof ImageFramesSchema>;
export type Preferences = S.Schema.Type<typeof PreferencesSchema>;
export type Tab = S.Schema.Type<typeof TabSchema>;
export type SetOrder = S.Schema.Type<typeof SetOrderSchema>;
export type SetOrders = S.Schema.Type<typeof SetOrdersSchema>;

// Export additional schemas from the other files
export {
  // GeneratePreviewStore schemas
  GeneratePreviewLayerImageDataSchema,
  GeneratePreviewStateSchema,
  createDefaultGeneratePreviewState,
} from './generatePreviewStore';

export {
  // CombinationsStore schemas
  CombinationsStateSchema,
  CalculateCombinationsInputSchema,
  createDefaultCombinationsState,
} from './combinationsStore';

export {
  // LayerOrderStore actions schemas
  MoveLayerInputSchema,
  ToggleLayerInputSchema,
  ToggleTraitInputSchema,
  SetForcedTraitInputSchema,
  GetLayerImageInputSchema,
} from './actions';

export {
  // LayerOrderStore main schema
  LayerOrderStoreStateSchema,
  createDefaultLayerOrderStoreState,
} from './layerOrderStore';

// Types générés par Effect
export type ExpandedLayers = S.Schema.Type<typeof ExpandedLayersSchema>;
