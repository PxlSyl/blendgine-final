import { useState, useRef } from 'react';
import { useLayerOrder } from '@/components/store/layerOrder/hook';
import { api } from '@/services';
import { BLEND_MODES, BlendMode } from '@/types/blendModes';
import type { TraitSetConfig } from '@/types/effect';

interface BlendProps {
  mode: BlendMode;
  opacity: number;
}

const defaultBlendMode: BlendMode = 'source-over';

const ensureSafeBlendMode = (mode: string | undefined): BlendMode => {
  if (!mode || !(mode in BLEND_MODES)) {
    return defaultBlendMode;
  }
  return mode as BlendMode;
};

export const useLayerBlend = (layer: string, onClose: () => void) => {
  const { rarityConfig, activeSetId, setRarityConfig } = useLayerOrder();

  const currentSetId = activeSetId ?? 'set1';

  const traits = rarityConfig[layer]?.traits ?? {};
  const activeTraits = Object.entries(traits).filter(([traitName]) => traitName !== 'None');
  const traitsCount = activeTraits.length;

  const uniqueBlendModes = new Set(
    activeTraits.map(([, trait]) => trait.sets?.[currentSetId]?.blend?.mode ?? defaultBlendMode)
  );

  const uniqueOpacities = new Set(
    activeTraits.map(([, trait]) => trait.sets?.[currentSetId]?.blend?.opacity ?? 1)
  );

  const [currentBlend, setCurrentBlend] = useState<BlendProps>({
    mode:
      uniqueBlendModes.size === 1
        ? ensureSafeBlendMode(activeTraits[0][1].sets?.[currentSetId]?.blend?.mode)
        : defaultBlendMode,
    opacity:
      uniqueOpacities.size === 1
        ? (activeTraits[0][1].sets?.[currentSetId]?.blend?.opacity ?? 1)
        : 1,
  });

  const initialBlend = useRef(currentBlend);

  const hasMultipleBlends = uniqueBlendModes.size > 1;

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
    const defaultBlend = rarityConfig[layer]?.defaultBlend ?? {
      mode: defaultBlendMode,
      opacity: 1,
    };
    setCurrentBlend({
      mode: ensureSafeBlendMode(defaultBlend.mode),
      opacity: defaultBlend.opacity ?? 1,
    });
  };

  const handleCancel = () => {
    setCurrentBlend(initialBlend.current);
    onClose();
  };

  const handleApply = async () => {
    try {
      const newConfig = { ...rarityConfig };

      if (!newConfig[layer]?.traits) {
        console.error('Layer or traits not found:', layer);
        return;
      }

      Object.entries(traits).forEach(([traitName]) => {
        if (traitName !== 'None') {
          if (!newConfig[layer]?.traits?.[traitName]) {
            console.error(`Trait ${traitName} not found in layer ${layer}`);
            return;
          }

          const traitConfig = newConfig[layer].traits[traitName];

          if (!traitConfig.sets) {
            traitConfig.sets = {};
          }

          if (!traitConfig.sets[currentSetId]) {
            const defaultSetConfig: TraitSetConfig = {
              blend: {
                mode: defaultBlendMode,
                opacity: 1,
              },
              zIndex: 0,
              enabled: false,
              value: 0,
              includeInMetadata: false,
            };

            const existingConfig = rarityConfig[layer]?.traits?.[traitName];
            const existingSetConfig = existingConfig?.sets?.[currentSetId];

            traitConfig.sets[currentSetId] = {
              ...defaultSetConfig,
              enabled: existingSetConfig?.enabled ?? defaultSetConfig.enabled,
              value: existingSetConfig?.value ?? defaultSetConfig.value,
            };
          }

          traitConfig.sets[currentSetId].blend = {
            mode: currentBlend.mode,
            opacity: currentBlend.opacity,
          };
        }
      });

      await api.saveRarityConfig(newConfig);
      setRarityConfig(newConfig);
      onClose();
    } catch (error) {
      console.error('Error applying blend:', error);
    }
  };

  return {
    currentBlend,
    traitsCount,
    hasMultipleBlends,
    hasChanges,
    handleOpacityChange,
    handleSelectBlendMode,
    handleReset,
    handleCancel,
    handleApply,
  };
};
