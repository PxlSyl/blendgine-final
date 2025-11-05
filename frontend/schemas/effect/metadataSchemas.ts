import * as S from '@effect/schema/Schema';

// Schema for Solana creator
export const SolanaCreatorSchema = S.Struct({
  address: S.String,
  share: S.Number.pipe(S.between(0, 100)),
});

// Schema for Solana metadata config
export const SolanaMetadataConfigSchema = S.Struct({
  symbol: S.String,
  sellerFeeBasisPoints: S.Number,
  externalUrl: S.String,
  creators: S.Array(SolanaCreatorSchema),
});

// Schema for interpolation method
export const InterpolationMethodSchema = S.Union(
  S.Literal('LUCAS_KANADE'),
  S.Literal('MOTION_FLOW'),
  S.Literal('BLEND'),
  S.Literal('PHASE_BASED'),
  S.Literal('BIDIRECTIONAL'),
  S.Literal('DISSOLVE'),
  S.Literal('BLOCK_BASED'),
  S.Literal('DISPLACEMENT_MAP')
);

// Schema for animation interpolation settings
export const AnimationInterpolationSettingsSchema = S.Struct({
  enabled: S.Boolean,
  method: InterpolationMethodSchema,
  factor: S.Number,
});

// Schema for WebP settings
export const WebPSettingsSchema = S.Struct({
  lossless: S.Boolean,
  quality: S.Number.pipe(S.between(0, 100)),
  method: S.Number.pipe(S.int()),
  interpolation: AnimationInterpolationSettingsSchema,
  autoloop: S.Boolean,
});

// Schema for GIF settings
export const GIFSettingsSchema = S.Struct({
  colors: S.Number,
  dithering: S.Boolean,
  ditheringMethod: S.Union(
    S.Literal('FLOYDSTEINBERG'),
    S.Literal('ORDERED'),
    S.Literal('RASTERIZE')
  ),
  interpolation: AnimationInterpolationSettingsSchema,
  autoloop: S.Boolean,
});

// Schema for MP4 settings
export const MP4SettingsSchema = S.Struct({
  quality: S.Number.pipe(S.between(0, 100)),
  interpolation: AnimationInterpolationSettingsSchema,
  autoloop: S.Boolean,
});

// Schema for WebM settings
export const WebMSettingsSchema = S.Struct({
  quality: S.Number.pipe(S.between(0, 100)),
  interpolation: AnimationInterpolationSettingsSchema,
  autoloop: S.Boolean,
});

// Schema for resize filter
export const ResizeFilterSchema = S.Union(
  S.Literal('NEAREST'),
  S.Literal('BILINEAR'),
  S.Literal('BICUBIC'),
  S.Literal('LANCZOS'),
  S.Literal('HAMMING'),
  S.Literal('MITCHELL'),
  S.Literal('GAUSSIAN')
);

// Schema for resize algorithm
export const ResizeAlgorithmSchema = S.Union(
  S.Literal('NEAREST'),
  S.Literal('CONVOLUTION'),
  S.Literal('INTERPOLATION'),
  S.Literal('SUPERSAMPLING')
);

// Schema for resize config
export const ResizeConfigSchema = S.Struct({
  algorithm: ResizeAlgorithmSchema,
  filter: S.optional(ResizeFilterSchema),
  superSamplingFactor: S.optional(S.Number.pipe(S.int(), S.positive())),
});

// Schema for animation quality config
export const AnimationQualityConfigSchema = S.Struct({
  optimize: S.Boolean,
  formatSpecificSettings: S.Struct({
    webp: WebPSettingsSchema,
    gif: GIFSettingsSchema,
    mp4: MP4SettingsSchema,
    webm: WebMSettingsSchema,
  }),
});

// Export types
export type SolanaCreator = S.Schema.Type<typeof SolanaCreatorSchema>;
export type SolanaMetadataConfig = S.Schema.Type<typeof SolanaMetadataConfigSchema>;
export type InterpolationMethod = S.Schema.Type<typeof InterpolationMethodSchema>;
export type AnimationInterpolationSettings = S.Schema.Type<
  typeof AnimationInterpolationSettingsSchema
>;
export type WebPSettings = S.Schema.Type<typeof WebPSettingsSchema>;
export type GIFSettings = S.Schema.Type<typeof GIFSettingsSchema>;
export type MP4Settings = S.Schema.Type<typeof MP4SettingsSchema>;
export type WebMSettings = S.Schema.Type<typeof WebMSettingsSchema>;
export type ResizeFilter = S.Schema.Type<typeof ResizeFilterSchema>;
export type ResizeAlgorithm = S.Schema.Type<typeof ResizeAlgorithmSchema>;
export type ResizeConfig = S.Schema.Type<typeof ResizeConfigSchema>;
export type AnimationQualityConfig = S.Schema.Type<typeof AnimationQualityConfigSchema>;
