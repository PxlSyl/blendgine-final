import * as S from '@effect/schema/Schema';
import { FILTER_BLEND_MODES } from '@/types/blendModes';

// Schema for filter types
export const FilterNameSchema = S.Union(
  S.Literal('tint'),
  S.Literal('negate'),
  S.Literal('vintage'),
  S.Literal('black_And_White'),
  S.Literal('clarity'),
  S.Literal('high_Contrast'),
  S.Literal('pixelate'),
  S.Literal('posterize'),
  S.Literal('bad_TV'),
  S.Literal('color_Shift'),
  S.Literal('duotone'),
  S.Literal('oil_Painting'),
  S.Literal('vignette'),
  S.Literal('border_Double'),
  S.Literal('border_Simple'),
  S.Literal('sepia'),
  S.Literal('old_Vignette'),
  S.Literal('retro_Palette'),
  S.Literal('blue_Print'),
  S.Literal('ascii_Art'),
  S.Literal('sharpen'),
  S.Literal('emboss'),
  S.Literal('blur'),
  S.Literal('edge_Detection'),
  S.Literal('bloom'),
  S.Literal('chromatic_Aberration'),
  S.Literal('watercolor'),
  S.Literal('paint_on_canvas'),
  S.Literal('dithering')
);

// Dithering algorithm schemas
export const DitherAlgorithmSchema = S.Union(
  S.Literal('floydsteinberg'),
  S.Literal('atkinson'),
  S.Literal('jarvisjudiceninke'),
  S.Literal('sierra'),
  S.Literal('stevensonarce'),
  S.Literal('stucki'),
  S.Literal('burke'),
  S.Literal('bayer'),
  S.Literal('clustereddot'),
  S.Literal('halftone'),
  S.Literal('bluenoise')
);

// Bayer specific options
export const BayerOptionsSchema = S.Struct({
  matrixSize: S.Union(S.Literal(2), S.Literal(4), S.Literal(8), S.Literal(16)),
});

// Sierra specific options
export const SierraOptionsSchema = S.Struct({
  variant: S.Union(S.Literal('sierra'), S.Literal('sierra2'), S.Literal('sierralite')),
});

// Clustered Dot specific options
export const ClusteredDotOptionsSchema = S.Struct({
  shape: S.Union(S.Literal('round'), S.Literal('square'), S.Literal('elliptical')),
  matrixSize: S.Union(S.Literal(8), S.Literal(16)),
});

// Halftone specific options
export const HalftoneOptionsSchema = S.Struct({
  angle: S.Number.pipe(S.between(0, 90)),
  shape: S.Union(
    S.Literal('circle'),
    S.Literal('square'),
    S.Literal('diamond'),
    S.Literal('ellipse')
  ),
  frequency: S.Number.pipe(S.between(50, 300)),
  overlap: S.Number.pipe(S.between(0, 0.5)),
});

// Bad TV specific options
export const BadTvOptionsSchema = S.Struct({
  scanlineIntensity: S.optional(S.Number.pipe(S.between(0.0, 15.0))),
  glitchFrequency: S.optional(S.Number.pipe(S.between(0.0, 5.0))),
  jitterStrength: S.optional(S.Number.pipe(S.between(0.0, 10.0))),
  colorShiftStrength: S.optional(S.Number.pipe(S.between(0.0, 25.0))),
  distortionStrength: S.optional(S.Number.pipe(S.between(0.0, 15.0))),
  rollSpeed: S.optional(S.Number.pipe(S.between(0.0, 10.0))),
  rollDirection: S.optional(
    S.Union(S.Literal('up'), S.Literal('down'), S.Literal('left'), S.Literal('right'))
  ),
  frameJumpIntensity: S.optional(S.Number.pipe(S.between(0.0, 100.0))),
});

// Schema for filter options
export const FilterOptionsSchema = S.mutable(
  S.Struct({
    enabled: S.Boolean,
    intensity: S.Number.pipe(S.between(0, 100)),
    radius: S.optional(S.Number.pipe(S.between(0, 100))),
    color1: S.optional(S.String),
    color2: S.optional(S.String),
    presetName: S.optional(S.String),
    palette: S.optional(S.Array(S.Array(S.Number))),
    // Tint specific options
    tintColor: S.optional(S.String),
    tintIntensity: S.optional(S.Number.pipe(S.between(0, 100))),
    // ASCII Art specific
    charset: S.optional(S.String),
    fontName: S.optional(S.String),
    fontSize: S.optional(S.Number),
    blockSize: S.optional(S.Number),
    // Dithering specific - paramètres généraux
    ditherAlgorithm: S.optional(DitherAlgorithmSchema),
    colorReduction: S.optional(S.Number.pipe(S.between(2, 255))),
    diffusionThreshold: S.optional(S.Number.pipe(S.between(0, 255))),
    diffusionDirection: S.optional(S.Union(S.Literal('lefttoright'), S.Literal('serpentine'))),
    customFactors: S.optional(S.Array(S.Number)),
    // Dithering specific - options par algorithme
    bayerOptions: S.optional(BayerOptionsSchema),
    sierraOptions: S.optional(SierraOptionsSchema),
    clusteredDotOptions: S.optional(ClusteredDotOptionsSchema),
    halftoneOptions: S.optional(HalftoneOptionsSchema),
    filterBlendMode: S.optional(S.Enums(FILTER_BLEND_MODES)),
    // Bad TV specific options
    badTvOptions: S.optional(BadTvOptionsSchema),
  })
);

// Schema for filters (record of filter options)
export const FiltersSchema = S.mutable(S.Record({ key: S.String, value: S.Unknown }));

// Schema for filter instance
export const FilterInstanceSchema = S.mutable(
  S.extend(
    FilterOptionsSchema,
    S.Struct({
      id: S.String,
      filterType: FilterNameSchema,
      includeInMetadata: S.Boolean,
    })
  )
);

// Types inférés des schémas
export type FilterName = S.Schema.Type<typeof FilterNameSchema>;
export type FilterOptions = S.Schema.Type<typeof FilterOptionsSchema>;
export type Filters = S.Schema.Type<typeof FiltersSchema>;
export type FilterInstance = S.Schema.Type<typeof FilterInstanceSchema>;

// Types pour les options spécifiques
export type DitherAlgorithm = S.Schema.Type<typeof DitherAlgorithmSchema>;
export type BayerOptions = S.Schema.Type<typeof BayerOptionsSchema>;
export type SierraOptions = S.Schema.Type<typeof SierraOptionsSchema>;
export type ClusteredDotOptions = S.Schema.Type<typeof ClusteredDotOptionsSchema>;
export type HalftoneOptions = S.Schema.Type<typeof HalftoneOptionsSchema>;
export type BadTvOptions = S.Schema.Type<typeof BadTvOptionsSchema>;
