import { useState, useRef } from 'react';
import { useLayerOrder } from '@/components/store/layerOrder/hook';
import { api } from '@/services';
import {
  BlendMode,
  BlendProperties,
  DEFAULT_BLEND_PROPERTIES,
  VALID_BLEND_MODES,
} from '@/types/blendModes';

export const useUniqueBlend = (layer: string, traitName: string, onClose: () => void) => {
  const { rarityConfig, activeSetId, setRarityConfig } = useLayerOrder();

  const currentSetId = activeSetId ?? 'set1';

  const getBlendMode = (blend: unknown): BlendMode => {
    if (blend && typeof blend === 'object' && 'mode' in blend && typeof blend.mode === 'string') {
      const { mode } = blend;
      if (VALID_BLEND_MODES.includes(mode as BlendMode)) {
        return mode as BlendMode;
      }
    }
    return DEFAULT_BLEND_PROPERTIES.mode;
  };

  const getBlendOpacity = (blend: unknown): number => {
    if (
      blend &&
      typeof blend === 'object' &&
      'opacity' in blend &&
      typeof blend.opacity === 'number'
    ) {
      const { opacity } = blend;
      return opacity >= 0 && opacity <= 1 ? opacity : DEFAULT_BLEND_PROPERTIES.opacity;
    }
    return DEFAULT_BLEND_PROPERTIES.opacity;
  };

  const [currentBlend, setCurrentBlend] = useState<BlendProperties>({
    mode:
      getBlendMode(rarityConfig[layer]?.traits?.[traitName]?.sets?.[currentSetId]?.blend) ||
      getBlendMode(rarityConfig[layer]?.defaultBlend) ||
      DEFAULT_BLEND_PROPERTIES.mode,
    opacity:
      getBlendOpacity(rarityConfig[layer]?.traits?.[traitName]?.sets?.[currentSetId]?.blend) ||
      getBlendOpacity(rarityConfig[layer]?.defaultBlend) ||
      DEFAULT_BLEND_PROPERTIES.opacity,
  });

  const initialBlend = useRef(currentBlend);

  const hasChanges =
    currentBlend.mode !== initialBlend.current.mode ||
    currentBlend.opacity !== initialBlend.current.opacity;

  const handleOpacityChange = (value: number) => {
    setCurrentBlend((prev) => ({
      ...prev,
      opacity: Math.min(Math.max(value, 0), 1),
    }));
  };

  const handleSelectBlendMode = (mode: BlendMode) => {
    setCurrentBlend((prev) => ({
      ...prev,
      mode,
    }));
  };

  const handleReset = () => {
    const defaultBlend = rarityConfig[layer]?.defaultBlend ?? DEFAULT_BLEND_PROPERTIES;
    setCurrentBlend({
      mode: getBlendMode(defaultBlend),
      opacity: getBlendOpacity(defaultBlend),
    });
  };

  const handleCancel = () => {
    setCurrentBlend(initialBlend.current);
    onClose();
  };

  const handleApply = async () => {
    try {
      const newConfig = { ...rarityConfig };
      if (newConfig[layer]?.traits?.[traitName]) {
        if (!newConfig[layer].traits[traitName].sets?.[currentSetId]) {
          const existingSets = Object.keys(rarityConfig[layer]?.traits?.[traitName]?.sets ?? {});
          const referenceSetId = existingSets.length > 0 ? existingSets[0] : '';

          if (!newConfig[layer].traits[traitName].sets) {
            newConfig[layer].traits[traitName].sets = {};
          }

          newConfig[layer].traits[traitName].sets[currentSetId] = {
            blend: {
              mode: getBlendMode(rarityConfig[layer]?.defaultBlend),
              opacity: getBlendOpacity(rarityConfig[layer]?.defaultBlend),
            },
            zIndex: 0,
            enabled: referenceSetId
              ? (rarityConfig[layer]?.traits?.[traitName]?.sets?.[referenceSetId]?.enabled ?? false)
              : false,
            value: referenceSetId
              ? (rarityConfig[layer]?.traits?.[traitName]?.sets?.[referenceSetId]?.value ?? 0)
              : 0,
          };
        }
        newConfig[layer].traits[traitName].sets[currentSetId].blend = {
          mode: currentBlend.mode,
          opacity: currentBlend.opacity,
        };
      } else {
        if (!newConfig[layer]) {
          newConfig[layer] = { traits: {} };
        }

        newConfig[layer].traits ??= {};
        if (!newConfig[layer].traits[traitName]) {
          newConfig[layer].traits[traitName] = {
            sets: {},
          };
        }

        if (!newConfig[layer].traits[traitName].sets) {
          newConfig[layer].traits[traitName].sets = {};
        }

        if (!newConfig[layer].traits[traitName].sets[currentSetId]) {
          const existingSets = Object.keys(rarityConfig[layer]?.traits?.[traitName]?.sets ?? {});
          const referenceSetId = existingSets.length > 0 ? existingSets[0] : '';

          newConfig[layer].traits[traitName].sets[currentSetId] = {
            blend: {
              mode: getBlendMode(rarityConfig[layer]?.defaultBlend),
              opacity: getBlendOpacity(rarityConfig[layer]?.defaultBlend),
            },
            zIndex: 0,
            enabled: referenceSetId
              ? (rarityConfig[layer]?.traits?.[traitName]?.sets?.[referenceSetId]?.enabled ?? false)
              : false,
            value: referenceSetId
              ? (rarityConfig[layer]?.traits?.[traitName]?.sets?.[referenceSetId]?.value ?? 0)
              : 0,
          };
        }
        newConfig[layer].traits[traitName].sets[currentSetId].blend = {
          mode: currentBlend.mode,
          opacity: currentBlend.opacity,
        };
      }

      await api.saveRarityConfig(newConfig);
      setRarityConfig(newConfig);
      onClose();
    } catch (error) {
      console.error('Error applying blend:', error);
    }
  };

  return {
    currentBlend,
    hasChanges,
    handleOpacityChange,
    handleSelectBlendMode,
    handleReset,
    handleCancel,
    handleApply,
  };
};
