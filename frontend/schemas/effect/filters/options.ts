import * as S from '@effect/schema/Schema';
import { FilterInstanceSchema } from './common';

// Schema for flip options
export const FlipOptionsSchema = S.mutable(
  S.Struct({
    horizontalFlipPercentage: S.Number.pipe(S.between(0, 100)),
    verticalFlipPercentage: S.Number.pipe(S.between(0, 100)),
    includeInMetadata: S.Boolean,
  })
);

// Schema pour les pipelines d'effets
export const EffectPipelineSchema = S.Struct({
  id: S.String,
  name: S.String,
  effects: S.Array(FilterInstanceSchema),
  distributionPercentage: S.Number.pipe(S.between(0, 100)),
});

// Schema for tinting options - maintenant avec pipelines
export const TintingOptionsSchema = S.mutable(
  S.Struct({
    includeFilterInMetadata: S.Boolean,
    pipelines: S.Array(EffectPipelineSchema), // Support des pipelines
    activePipelineId: S.optional(S.String), // Pipeline actif
  })
);

// Types inférés des schémas
export type FlipOptions = S.Schema.Type<typeof FlipOptionsSchema>;
export type EffectPipeline = S.Schema.Type<typeof EffectPipelineSchema>;
export type TintingOptions = S.Schema.Type<typeof TintingOptionsSchema>;
