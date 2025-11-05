import * as S from '@effect/schema/Schema';
import { RarityConfigSchema } from '../layerOrder';
import {
  FilterNameSchema,
  FilterOptionsSchema,
  FiltersSchema,
  FilterInstanceSchema,
  FilterName,
  FilterOptions,
  Filters,
  FilterInstance,
} from './common';
import { FlipOptionsSchema, TintingOptionsSchema, FlipOptions, TintingOptions } from './options';

export const FilterStoreStateSchema = S.Struct({
  activeFilter: S.optional(FilterNameSchema),
  filterOptions: S.optional(S.Struct({})), // Record<FilterName, FilterOptions>
  isLoading: S.optional(S.Boolean),
  error: S.optional(S.String),
  sourceFolder: S.String,
  destinationFolder: S.String,
  hasUserSelectedFolders: S.Boolean,
  flipOptions: S.mutable(FlipOptionsSchema),
  tintingOptions: S.mutable(TintingOptionsSchema),
  selectedPaletteName: S.String,
  lastAdjustmentMade: S.Boolean,
  exportFormat: S.String,
  isAnimated: S.Boolean,
});

export const FlipFlopStateSchema = S.Struct({
  flipOptions: S.mutable(FlipOptionsSchema),
});

export const TintingSliceStateSchema = S.Struct({
  tintingOptions: S.mutable(TintingOptionsSchema),
  selectedPaletteName: S.String,
  lastAdjustmentMade: S.Boolean,
});

export type FilterStoreState = S.Schema.Type<typeof FilterStoreStateSchema>;
export type FlipFlopState = S.Schema.Type<typeof FlipFlopStateSchema>;
export type TintingSliceState = S.Schema.Type<typeof TintingSliceStateSchema>;

export type { FilterName, FilterOptions, Filters, FilterInstance };

export { FilterNameSchema, FilterOptionsSchema, FiltersSchema, FilterInstanceSchema };

export type { FlipOptions, TintingOptions };

export { FlipOptionsSchema, TintingOptionsSchema };

export const ApplyTintsAndFiltersArgsSchema = S.Struct({
  sourceFolder: S.String,
  destinationFolder: S.String,
  collectionName: S.String,
  imageFormat: S.String,
  exportFormat: S.String,
  nftCount: S.Number,
  rarityConfig: RarityConfigSchema,
  tintingOptions: S.Struct({
    includeFilterInMetadata: S.Boolean,
    pipelines: S.Array(
      S.Struct({
        id: S.String,
        name: S.String,
        effects: S.Array(FilterInstanceSchema),
        distributionPercentage: S.Number,
      })
    ),
    activePipelineId: S.optional(S.String),
  }),
  flipOptions: FlipOptionsSchema,
  isAnimated: S.Boolean,
  effectChainId: S.optional(S.String), // ID de la chaîne d'effets pour la traçabilité
});

export const FilterImageInfoSchema = S.Struct({
  path: S.String,
  name: S.String,
  nftNumber: S.Number,
  filterType: S.String,
  filterDetails: S.String,
  horizontalFlipApplied: S.optional(S.Boolean),
  verticalFlipApplied: S.optional(S.Boolean),
});

export const FilterProgressInfoSchema = S.Struct({
  currentCount: S.Number,
  totalCount: S.Number,
  estimatedCount: S.Number,
  currentImage: FilterImageInfoSchema,
  status: S.String,
});

export type ApplyTintsAndFiltersArgs = S.Schema.Type<typeof ApplyTintsAndFiltersArgsSchema>;
export type FilterImageInfo = S.Schema.Type<typeof FilterImageInfoSchema>;
export type FilterProgressInfo = S.Schema.Type<typeof FilterProgressInfoSchema>;
