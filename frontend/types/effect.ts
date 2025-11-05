import * as S from '@effect/schema/Schema';
import {
  ProjectSetupSchema,
  ProjectSetupStateSchema,
  SpritesheetLayoutSchema,
  BlendPropertiesSchema as PreviewBlendPropertiesSchema,
  LayerImageInfoSchema,
  DimensionsSchema,
  LayerImagesSchema,
  ImageEntrySchema,
  LayerPreviewStateSchema,
  LayerPreviewDataSchema,
  // Nouveaux schémas AppStore
  AppStateSchema,
  GenerationStateSchema,
  // Nouveaux schémas AuthStore
  AuthStateSchema,
  UserSchema,
  // Nouveaux schémas Generation
  ImageSetupPersistentStateSchema,
  ImageSetupStateSchema,
  // Nouveaux schémas DataGaming
  DataGamingStateSchema,
  GameAttributeSchema,
  GameHeaderSchema,
} from '../schemas/effect';

// Import des schémas de métadonnées
import {
  InterpolationMethodSchema,
  AnimationInterpolationSettingsSchema,
  WebPSettingsSchema,
  GIFSettingsSchema,
  MP4SettingsSchema,
  WebMSettingsSchema,
  AnimationQualityConfigSchema,
  SolanaCreatorSchema,
  SolanaMetadataConfigSchema,
  ResizeAlgorithmSchema,
  ResizeFilterSchema,
  ResizeConfigSchema,
} from '../schemas/effect/metadataSchemas';

import {
  RenameRequestSchema,
  FileExtensionSchema,
  LayerNameSchema,
  TraitNameSchema,
} from '../schemas/effect/projectSetup/renameStore';
import {
  BlendPropertiesSchema,
  LayerImageDataSchema,
  SetOrderedLayersArgSchema,
  OrderedLayersSetSchema,
  OrderedLayersSetsSchema,
  SetConfigSchema,
  TraitSetConfigSchema,
  TraitConfigSchema,
  LayerConfigSchema,
  RarityConfigSchema,
  ExpandedLayersSchema,
  CurrentTraitsSchema,
  ForcedTraitsSchema,
  LayerOrderStateSchema,
  // Combinations store schemas
  CombinationsStateSchema,
  CalculateCombinationsInputSchema,
  // Layer order store schemas
  LayerOrderStoreStateSchema,
  MoveLayerInputSchema,
  ToggleLayerInputSchema,
  ToggleTraitInputSchema,
  SetForcedTraitInputSchema,
  GetLayerImageInputSchema,
  // New schemas
  ImageDimensionsSchema,
  LayerDataSchema,
  InitialFolderDataSchema,
  GeneratedImageSchema,
  ConsoleMessageSchema,
  NFTGenerationArgsSchema,
  // Incompatibilities and forced combinations schemas
  IncompatibilitiesSchema,
  IncompatibilitiesBySetSchema,
  ForcedCombinationsSchema,
  ForcedCombinationsBySetSchema,
  IncompatibilitySelectorTypeSchema,
  ForcedCombinationSelectorTypeSchema,
  IncompatibilitySideSchema,
  ForcedCombinationSideSchema,
  // Additional schemas
  FrameDataSchema,
  ImageFramesSchema,
  PreferencesSchema,
  TabSchema,
  SetInfoSchema,
  UpdateRarityActionSchema,
} from '../schemas/effect/layerOrder';

// Import direct des schémas layerOrder
import {
  GeneratePreviewStateSchema,
  GeneratePreviewLayerImageDataSchema,
} from '../schemas/effect/layerOrder/generatePreviewStore';

// Import schemas from rarityStore
import {
  GlobalRarityDataSchema,
  GlobalRarityStateSchema,
  GlobalRarityStoreSchema,
} from '../schemas/effect/rarityStore';

// Import schemas from rulesStore
import {
  IncompatibilityStateSchema,
  ForcedCombinationStateSchema,
  RulesModeSchema,
  RulesStateSchema,
} from '../schemas/effect/rulesStore';
import {
  FilterNameSchema,
  FilterOptionsSchema,
  FiltersSchema,
  FilterInstanceSchema,
  FlipOptionsSchema,
  TintingOptionsSchema,
} from '@/schemas/effect/filters';

// Types inferred from schemas
export type ProjectSetup = S.Schema.Type<typeof ProjectSetupSchema>;
export type ProjectSetupState = S.Schema.Type<typeof ProjectSetupStateSchema>;
export type SpritesheetLayout = S.Schema.Type<typeof SpritesheetLayoutSchema>;
export type BlendProperties = S.Schema.Type<typeof PreviewBlendPropertiesSchema>;
export type LayerImageInfo = S.Schema.Type<typeof LayerImageInfoSchema>;
export type Dimensions = S.Schema.Type<typeof DimensionsSchema>;
export type LayerImages = S.Schema.Type<typeof LayerImagesSchema>;
export type ImageEntry = S.Schema.Type<typeof ImageEntrySchema>;
export type LayerPreviewState = S.Schema.Type<typeof LayerPreviewStateSchema>;
export type LayerPreviewData = S.Schema.Type<typeof LayerPreviewDataSchema>;

// Rename store types
export type RenameRequest = S.Schema.Type<typeof RenameRequestSchema>;
export type FileExtension = S.Schema.Type<typeof FileExtensionSchema>;
export type LayerName = S.Schema.Type<typeof LayerNameSchema>;
export type TraitName = S.Schema.Type<typeof TraitNameSchema>;

// Layer order types
export type LayerOrderBlendProperties = S.Schema.Type<typeof BlendPropertiesSchema>;
export type LayerImageData = S.Schema.Type<typeof LayerImageDataSchema>;
export type SetOrderedLayersArg = S.Schema.Type<typeof SetOrderedLayersArgSchema>;
export type OrderedLayersSet = S.Schema.Type<typeof OrderedLayersSetSchema>;
export type OrderedLayersSets = S.Schema.Type<typeof OrderedLayersSetsSchema>;
export type SetConfig = S.Schema.Type<typeof SetConfigSchema>;
export type TraitSetConfig = S.Schema.Type<typeof TraitSetConfigSchema>;
export type TraitConfig = S.Schema.Type<typeof TraitConfigSchema>;
export type LayerConfig = S.Schema.Type<typeof LayerConfigSchema>;
export type RarityConfig = S.Schema.Type<typeof RarityConfigSchema>;
export type ExpandedLayers = S.Schema.Type<typeof ExpandedLayersSchema>;
export type CurrentTraits = S.Schema.Type<typeof CurrentTraitsSchema>;
export type ForcedTraits = S.Schema.Type<typeof ForcedTraitsSchema>;
export type LayerOrderState = S.Schema.Type<typeof LayerOrderStateSchema>;
export type SetInfo = S.Schema.Type<typeof SetInfoSchema>;
// Combinations store types
export type CombinationsState = S.Schema.Type<typeof CombinationsStateSchema>;
export type CalculateCombinationsInput = S.Schema.Type<typeof CalculateCombinationsInputSchema>;

// Layer order store types
export type LayerOrderStoreState = S.Schema.Type<typeof LayerOrderStoreStateSchema>;
export type MoveLayerInput = S.Schema.Type<typeof MoveLayerInputSchema>;
export type ToggleLayerInput = S.Schema.Type<typeof ToggleLayerInputSchema>;
export type ToggleTraitInput = S.Schema.Type<typeof ToggleTraitInputSchema>;
export type SetForcedTraitInput = S.Schema.Type<typeof SetForcedTraitInputSchema>;
export type GetLayerImageInput = S.Schema.Type<typeof GetLayerImageInputSchema>;

// New types
export type ImageDimensions = S.Schema.Type<typeof ImageDimensionsSchema>;
export type LayerImage = S.Schema.Type<typeof LayerImagesSchema>;
export type LayerData = S.Schema.Type<typeof LayerDataSchema>;
export type InitialFolderData = S.Schema.Type<typeof InitialFolderDataSchema>;
export type FilterName = S.Schema.Type<typeof FilterNameSchema>;
export type FilterOptions = S.Schema.Type<typeof FilterOptionsSchema>;
export type Filters = S.Schema.Type<typeof FiltersSchema>;
export type FilterInstance = S.Schema.Type<typeof FilterInstanceSchema>;
export type FlipOptions = S.Schema.Type<typeof FlipOptionsSchema>;
export type TintingOptions = S.Schema.Type<typeof TintingOptionsSchema>;

export type InterpolationMethod = S.Schema.Type<typeof InterpolationMethodSchema>;
export type AnimationInterpolationSettings = S.Schema.Type<
  typeof AnimationInterpolationSettingsSchema
>;
export type WebPSettings = S.Schema.Type<typeof WebPSettingsSchema>;
export type GIFSettings = S.Schema.Type<typeof GIFSettingsSchema>;
export type MP4Settings = S.Schema.Type<typeof MP4SettingsSchema>;
export type WebMSettings = S.Schema.Type<typeof WebMSettingsSchema>;

export type AnimationQualityConfig = S.Schema.Type<typeof AnimationQualityConfigSchema>;
export type SolanaCreator = S.Schema.Type<typeof SolanaCreatorSchema>;
export type SolanaMetadataConfig = S.Schema.Type<typeof SolanaMetadataConfigSchema>;
export type GeneratedImage = S.Schema.Type<typeof GeneratedImageSchema>;
export type ConsoleMessage = S.Schema.Type<typeof ConsoleMessageSchema>;
export type NFTGenerationArgs = S.Schema.Type<typeof NFTGenerationArgsSchema>;
export type UpdateRarityAction = S.Schema.Type<typeof UpdateRarityActionSchema>;

// Incompatibilities and forced combinations types
export type Incompatibilities = S.Schema.Type<typeof IncompatibilitiesSchema>;
export type IncompatibilitiesBySets = S.Schema.Type<typeof IncompatibilitiesBySetSchema>;
export type ForcedCombinations = S.Schema.Type<typeof ForcedCombinationsSchema>;
export type ForcedCombinationsBySets = S.Schema.Type<typeof ForcedCombinationsBySetSchema>;
export type IncompatibilitySelectorType = S.Schema.Type<typeof IncompatibilitySelectorTypeSchema>;
export type ForcedCombinationSelectorType = S.Schema.Type<
  typeof ForcedCombinationSelectorTypeSchema
>;
export type IncompatibilitySide = S.Schema.Type<typeof IncompatibilitySideSchema>;
export type ForcedCombinationSide = S.Schema.Type<typeof ForcedCombinationSideSchema>;

// Additional types
export type FrameData = S.Schema.Type<typeof FrameDataSchema>;
export type ImageFrames = S.Schema.Type<typeof ImageFramesSchema>;
export type Preferences = S.Schema.Type<typeof PreferencesSchema>;
export type Tab = S.Schema.Type<typeof TabSchema>;

// AppStore types
export type AppState = S.Schema.Type<typeof AppStateSchema>;
export type GenerationState = S.Schema.Type<typeof GenerationStateSchema>;

// AuthStore types
export type AuthState = S.Schema.Type<typeof AuthStateSchema>;
export type User = S.Schema.Type<typeof UserSchema>;

// GenerationStore types
export type ImageSetupPersistentState = S.Schema.Type<typeof ImageSetupPersistentStateSchema>;
export type ImageSetupState = S.Schema.Type<typeof ImageSetupStateSchema> & {
  getMaxImageSize: () => number;
};

// DataGaming types
export type DataGamingState = S.Schema.Type<typeof DataGamingStateSchema>;
export type GameAttribute = S.Schema.Type<typeof GameAttributeSchema>;
export type GameHeader = S.Schema.Type<typeof GameHeaderSchema>;

// GeneratePreview types
export type GeneratePreviewLayerImageData = S.Schema.Type<
  typeof GeneratePreviewLayerImageDataSchema
> & {
  imageElement?: HTMLImageElement;
};

export type GeneratePreviewState = S.Schema.Type<typeof GeneratePreviewStateSchema>;

// GlobalRarityStore types
export type GlobalRarityData = S.Schema.Type<typeof GlobalRarityDataSchema>;
export type GlobalRarityState = S.Schema.Type<typeof GlobalRarityStateSchema>;
export type GlobalRarityStore = S.Schema.Type<typeof GlobalRarityStoreSchema>;

// RulesStore types
export type RulesMode = S.Schema.Type<typeof RulesModeSchema>;
export type RulesState = S.Schema.Type<typeof RulesStateSchema>;
export type RulesStore = S.Schema.Type<typeof RulesStateSchema>;
export type IncompatibilityState = S.Schema.Type<typeof IncompatibilityStateSchema>;
export type IncompatibilityStore = S.Schema.Type<typeof IncompatibilityStateSchema>;
export type ForcedCombinationState = S.Schema.Type<typeof ForcedCombinationStateSchema>;
export type ForcedCombinationStore = S.Schema.Type<typeof ForcedCombinationStateSchema>;

// Resize types
export type ResizeAlgorithm = S.Schema.Type<typeof ResizeAlgorithmSchema>;
export type ResizeFilter = S.Schema.Type<typeof ResizeFilterSchema>;
export type ResizeConfig = S.Schema.Type<typeof ResizeConfigSchema>;
