import { useState, useCallback, useRef, useEffect } from 'react';
import { Effect } from 'effect';

import { useColorStore } from '@/components/store/randomUI';

import { DEFAULT_BLEND_PROPERTIES } from '@/types/blendModes';
import type {
  TraitConfig,
  RarityConfig,
  ExpandedLayers,
  ForcedTraits,
  SetInfo,
} from '@/types/effect';

interface LayerOrderData {
  rarityConfig: RarityConfig;
  expandedLayers: ExpandedLayers;
  forcedTraits: ForcedTraits;
  sets: Record<string, SetInfo>;
  activeSetId: string | null;
  updateRarityConfig: (fn: (config: RarityConfig) => RarityConfig) => void;
  saveRarityConfig: () => Promise<void>;
  saveState: () => Promise<void>;
  toggleLayerExpansion: (layer: string) => void;
  toggleLayerDisabled: (layer: string) => void;
  toggleTraitDisabled: (layer: string, trait: string) => void;
  forceTraitPreview: (layer: string, trait: string) => Promise<void>;
  triggerGeneration: () => Promise<void>;
  isGenerating: boolean;
}

export const useDraggableLayer = (layer: string, layerOrderData: LayerOrderData) => {
  const {
    rarityConfig,
    expandedLayers,
    forcedTraits,
    sets,
    activeSetId,
    updateRarityConfig,
    saveRarityConfig,
    saveState,
    toggleLayerExpansion: toggleLayerExpansionAction,
    toggleLayerDisabled,
    toggleTraitDisabled,
    forceTraitPreview,
    triggerGeneration,
    isGenerating,
  } = layerOrderData;

  const currentSetId = activeSetId ?? 'set1';
  const isDisabled = !rarityConfig[layer]?.sets?.[currentSetId]?.active;
  const isExpanded = expandedLayers[currentSetId]?.[layer] || false;
  const traits = rarityConfig[layer]?.traits ?? {};
  const isFirstLayer = sets[currentSetId]?.layers[0] === layer;
  const [isBlendSelectorOpen, setIsBlendSelectorOpen] = useState<string>('');
  const [showTooltip, setShowTooltip] = useState(false);
  const [isLayerBlendOpen, setIsLayerBlendOpen] = useState(false);
  const blendSelectorRef = useRef<HTMLDivElement>(null);
  const getColorForKey = useColorStore((state) => state.getColorForKey);

  const isTraitEnabled = useCallback(
    (traitName: string) => {
      return rarityConfig[layer]?.traits?.[traitName]?.sets?.[currentSetId]?.enabled ?? true;
    },
    [layer, currentSetId, rarityConfig]
  );

  const getTraitSetConfig = useCallback(
    (traitConfig: TraitConfig) => {
      return (
        traitConfig.sets?.[currentSetId] || {
          blend: DEFAULT_BLEND_PROPERTIES,
          zIndex: 0,
          enabled: false,
          value: 0,
        }
      );
    },
    [currentSetId]
  );

  const getBlendIconColor = useCallback(
    (traitConfig: TraitConfig) => {
      const config = getTraitSetConfig(traitConfig);
      const blendMode = config.blend?.mode || DEFAULT_BLEND_PROPERTIES.mode;
      const opacity = config.blend?.opacity || DEFAULT_BLEND_PROPERTIES.opacity;

      if (
        blendMode !== DEFAULT_BLEND_PROPERTIES.mode ||
        opacity !== DEFAULT_BLEND_PROPERTIES.opacity
      ) {
        return 'text-[rgb(var(--color-accent))]';
      }
      return 'text-gray-400';
    },
    [getTraitSetConfig]
  );

  const handleMouseEnter = useCallback(() => {
    setShowTooltip(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setShowTooltip(false);
  }, []);

  const isLayerIncludedInMetadata = useCallback(() => {
    return rarityConfig[layer]?.sets?.[currentSetId]?.includeInMetadata ?? true;
  }, [layer, currentSetId, rarityConfig]);

  const isTraitIncludedInMetadata = useCallback(
    (traitName: string) => {
      return (
        rarityConfig[layer]?.traits?.[traitName]?.sets?.[currentSetId]?.includeInMetadata ?? true
      );
    },
    [layer, currentSetId, rarityConfig]
  );

  const toggleLayerMetadataInclusion = useCallback(() => {
    const metadataEffect = Effect.gen(function* (_) {
      const currentInclusion = rarityConfig[layer]?.sets?.[currentSetId]?.includeInMetadata ?? true;
      const newInclusionState = !currentInclusion;

      yield* _(
        Effect.try({
          try: () => {
            updateRarityConfig((config) => {
              const newConfig = { ...config };

              if (!newConfig[layer]) {
                newConfig[layer] = {
                  sets: {},
                  traits: {},
                  defaultBlend: DEFAULT_BLEND_PROPERTIES,
                };
              }

              const layerConfig = newConfig[layer];

              layerConfig.sets ??= {};

              if (!layerConfig.sets[currentSetId]) {
                layerConfig.sets[currentSetId] = { active: true };
              }

              layerConfig.sets[currentSetId] = {
                ...layerConfig.sets[currentSetId],
                includeInMetadata: newInclusionState,
              };

              const { traits } = layerConfig;
              if (traits && Object.keys(traits).length > 0) {
                Object.keys(traits).forEach((traitName) => {
                  if (traitName === 'None') {
                    return;
                  }

                  const trait = traits[traitName];
                  if (!trait) {
                    return;
                  }

                  if (!trait.sets) {
                    trait.sets = {};
                  }

                  if (!trait.sets[currentSetId]) {
                    trait.sets[currentSetId] = {
                      blend: DEFAULT_BLEND_PROPERTIES,
                      zIndex: 0,
                      enabled: false,
                      value: 0,
                    };
                  }

                  const isEnabled = trait.sets[currentSetId]?.enabled ?? false;
                  trait.sets[currentSetId] = {
                    ...trait.sets[currentSetId],
                    includeInMetadata: isEnabled ? newInclusionState : false,
                  };
                });
              }

              return newConfig;
            });
          },
          catch: (error) => {
            console.error('Error updating rarity config:', error);
          },
        })
      );

      yield* _(
        Effect.tryPromise({
          try: () => {
            return Promise.all([saveRarityConfig(), saveState()]);
          },
          catch: (error) => {
            console.error('Error saving state:', error);
            return Promise.resolve();
          },
        })
      );
    });

    void Effect.runPromise(metadataEffect);
  }, [layer, currentSetId, rarityConfig, updateRarityConfig, saveRarityConfig, saveState]);

  const toggleTraitMetadataInclusion = useCallback(
    (traitName: string) => {
      const traitEffect = Effect.gen(function* (_) {
        const currentTraitInclusion =
          rarityConfig[layer]?.traits?.[traitName]?.sets?.[currentSetId]?.includeInMetadata ?? true;
        const newTraitInclusionState = !currentTraitInclusion;

        yield* _(
          Effect.try({
            try: () => {
              updateRarityConfig((config) => {
                const newConfig = { ...config };

                if (!newConfig[layer]) {
                  newConfig[layer] = {
                    sets: {},
                    traits: {},
                    defaultBlend: DEFAULT_BLEND_PROPERTIES,
                  };
                }

                const layerConfig = newConfig[layer];

                layerConfig.traits ??= {};

                if (!layerConfig.traits[traitName]) {
                  layerConfig.traits[traitName] = { sets: {} };
                }

                const trait = layerConfig.traits[traitName];

                trait.sets ??= {};

                if (!trait.sets[currentSetId]) {
                  trait.sets[currentSetId] = {
                    blend: DEFAULT_BLEND_PROPERTIES,
                    zIndex: 0,
                    enabled: false,
                    value: 0,
                  };
                }

                trait.sets[currentSetId] = {
                  ...trait.sets[currentSetId],
                  includeInMetadata: newTraitInclusionState,
                };

                layerConfig.sets ??= {};

                if (!layerConfig.sets[currentSetId]) {
                  layerConfig.sets[currentSetId] = { active: true };
                }

                if (newTraitInclusionState) {
                  layerConfig.sets[currentSetId] = {
                    ...layerConfig.sets[currentSetId],
                    includeInMetadata: true,
                  };
                } else {
                  const allTraits = Object.keys(layerConfig.traits);
                  const allTraitsDisabled = allTraits.every((t) => {
                    if (t === traitName) {
                      return true;
                    }
                    if (!layerConfig.traits) {
                      return true;
                    }

                    const traitConfig = layerConfig.traits[t];
                    if (!traitConfig?.sets) {
                      return true;
                    }

                    return !(traitConfig.sets[currentSetId]?.includeInMetadata ?? true);
                  });

                  if (allTraitsDisabled) {
                    layerConfig.sets[currentSetId] = {
                      ...layerConfig.sets[currentSetId],
                      includeInMetadata: false,
                    };
                  }
                }

                return newConfig;
              });
            },
            catch: (error) => {
              console.error('Error updating trait metadata:', error);
            },
          })
        );

        yield* _(
          Effect.tryPromise({
            try: () => {
              return Promise.all([saveRarityConfig(), saveState()]);
            },
            catch: (error) => {
              console.error('Error saving state:', error);
              return Promise.resolve();
            },
          })
        );
      });

      void Effect.runPromise(traitEffect);
    },
    [layer, currentSetId, rarityConfig, updateRarityConfig, saveRarityConfig, saveState]
  );

  const handleToggleDisable = useCallback(() => {
    const isCurrentlyActive = rarityConfig[layer]?.sets?.[currentSetId]?.active;

    if (isExpanded && isCurrentlyActive) {
      toggleLayerExpansionAction(layer);
    }

    toggleLayerDisabled(layer);
  }, [
    isExpanded,
    layer,
    currentSetId,
    rarityConfig,
    toggleLayerExpansionAction,
    toggleLayerDisabled,
  ]);

  const triggerGenerationRef = useRef(triggerGeneration);
  triggerGenerationRef.current = triggerGeneration;

  const handleToggleTraitDisable = useCallback(
    (traitName: string) => {
      toggleTraitDisabled(layer, traitName);
      setTimeout(() => {
        if (!isGenerating) {
          void triggerGenerationRef.current();
        }
      }, 50);
    },
    [layer, toggleTraitDisabled, isGenerating]
  );

  const handleZIndexChange = useCallback(
    (layer: string, trait: string, newZIndex: number) => {
      const zIndexEffect = Effect.gen(function* (_) {
        yield* _(
          Effect.try({
            try: () => {
              updateRarityConfig((config) => {
                const newConfig = { ...config };

                if (!newConfig[layer]) {
                  return newConfig;
                }

                const layerConfig = newConfig[layer];
                if (!layerConfig.traits?.[trait]?.sets) {
                  return newConfig;
                }

                if (!layerConfig.traits[trait].sets[currentSetId]) {
                  layerConfig.traits[trait].sets[currentSetId] = {
                    blend: DEFAULT_BLEND_PROPERTIES,
                    zIndex: 0,
                    enabled: false,
                    value: 0,
                  };
                }

                layerConfig.traits[trait].sets[currentSetId].zIndex = newZIndex;
                return newConfig;
              });
            },
            catch: (error) => {
              console.error('Error updating z-index:', error);
            },
          })
        );

        yield* _(
          Effect.tryPromise({
            try: () => {
              return Promise.all([saveRarityConfig(), saveState()]);
            },
            catch: (error) => {
              console.error('Error saving state:', error);
              return Promise.resolve();
            },
          })
        );
      });

      void Effect.runPromise(zIndexEffect);
    },
    [currentSetId, updateRarityConfig, saveRarityConfig, saveState]
  );

  const handlePreviewTrait = useCallback(
    (traitName: string) => {
      void forceTraitPreview(layer, traitName);
      void saveState();
    },
    [layer, forceTraitPreview, saveState]
  );

  const toggleBlendSelector = useCallback((traitName: string) => {
    setIsBlendSelectorOpen((prevTrait) => {
      const newValue = prevTrait === traitName ? '' : traitName;
      if (!newValue) {
        setShowTooltip(false);
      }
      return newValue;
    });
  }, []);

  const toggleLayerExpansion = useCallback(
    (layerName: string) => {
      toggleLayerExpansionAction(layerName);
    },
    [toggleLayerExpansionAction]
  );

  useEffect(() => {
    if (isDisabled && isExpanded) {
      toggleLayerExpansionAction(layer);
    }
  }, [isDisabled, isExpanded, layer, toggleLayerExpansionAction]);

  return {
    isDisabled,
    isExpanded,
    traits,
    isFirstLayer,
    isBlendSelectorOpen,
    showTooltip,
    setShowTooltip,
    isLayerBlendOpen,
    blendSelectorRef,
    forcedTraits,
    getColorForKey,
    handleToggleDisable,
    handleToggleTraitDisable,
    isTraitEnabled,
    handleZIndexChange,
    handlePreviewTrait,
    toggleBlendSelector,
    getBlendIconColor,
    handleMouseEnter,
    handleMouseLeave,
    getTraitSetConfig,
    setIsLayerBlendOpen,
    setIsBlendSelectorOpen,
    toggleLayerExpansion,
    isLayerIncludedInMetadata,
    isTraitIncludedInMetadata,
    toggleLayerMetadataInclusion,
    toggleTraitMetadataInclusion,
  };
};
