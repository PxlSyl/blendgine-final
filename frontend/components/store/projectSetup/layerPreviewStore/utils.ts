import type { BlendProperties, RarityConfig } from '@/types/effect';
import { DEFAULT_BLEND_PROPERTIES, BlendMode, BLEND_MODES } from '@/types/blendModes';
import { isSupportedImageFormat } from '@/utils/imageUtils';

import { useLayerOrderStore } from '../../layerOrder/main';

import { BlendPropertiesSchema } from '@/schemas/effect/projectSetup/previews';
import { safeValidate } from '@/utils/effect/effectValidation';

const validateBlendMode = (mode: string): BlendMode => {
  const validMode = mode in BLEND_MODES ? mode : DEFAULT_BLEND_PROPERTIES.mode;
  return validMode as BlendMode;
};

export const getBlendPropertiesForTrait = (
  layerName: string,
  traitName: string,
  rarityConfig: RarityConfig | null
): BlendProperties => {
  if (!rarityConfig) {
    return DEFAULT_BLEND_PROPERTIES;
  }

  const { activeSetId } = useLayerOrderStore.getState();
  const setId = activeSetId ?? 'set1';

  const layerConfig = rarityConfig[layerName];
  if (!layerConfig) {
    return DEFAULT_BLEND_PROPERTIES;
  }

  const traitConfig = layerConfig.traits?.[traitName];
  if (!traitConfig) {
    const defaultBlend = layerConfig.defaultBlend ?? DEFAULT_BLEND_PROPERTIES;
    return {
      mode: validateBlendMode(defaultBlend.mode),
      opacity: defaultBlend.opacity,
    };
  }

  const setConfig = traitConfig.sets?.[setId];
  if (!setConfig) {
    const defaultBlend = layerConfig.defaultBlend ?? DEFAULT_BLEND_PROPERTIES;
    return {
      mode: validateBlendMode(defaultBlend.mode),
      opacity: defaultBlend.opacity,
    };
  }

  const blendProps = setConfig.blend || layerConfig.defaultBlend || DEFAULT_BLEND_PROPERTIES;
  const validatedMode = validateBlendMode(blendProps.mode);
  const validatedProps = {
    mode: validatedMode,
    opacity: blendProps.opacity,
  } as const;

  const result = safeValidate(BlendPropertiesSchema, validatedProps);

  return result.success && result.data ? result.data : DEFAULT_BLEND_PROPERTIES;
};

export const isImageFile = (filename: string): boolean => {
  return isSupportedImageFormat(filename);
};

export const fileExistsCache = new Map<string, boolean>();
export const blendPropertiesCache = new Map<string, BlendProperties>();
export const processedFramesCache = new Set<string>();

export const processFrames = (
  projectId: string,
  layerName: string,
  imageNameWithoutExt: string,
  isAnimatedCollection: boolean
): boolean => {
  if (isAnimatedCollection && projectId) {
    try {
      const cacheKey = `${projectId}/${layerName}/${imageNameWithoutExt}`;
      if (processedFramesCache.has(cacheKey)) {
        return true;
      }

      processedFramesCache.add(cacheKey);
      return true;
    } catch (error) {
      console.error('Error processing frames:', error);
      return false;
    }
  }
  return false;
};
