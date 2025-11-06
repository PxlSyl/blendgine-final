import { emit } from '@tauri-apps/api/event';

import { DEFAULT_BLEND_PROPERTIES, type BlendMode } from '@/types/blendModes';
import type { SetInfo, TraitConfig, RarityConfig } from '@/types/effect';
import type { LayerConfig } from '@/schemas/effect/layerOrder';

import { useCombinationsStore } from '@/components/store/layerOrder/combinationsStore';

const createSafeBlendObject = (defaultBlend?: unknown) => {
  if (
    defaultBlend &&
    typeof defaultBlend === 'object' &&
    'mode' in defaultBlend &&
    'opacity' in defaultBlend &&
    typeof defaultBlend.mode === 'string' &&
    typeof defaultBlend.opacity === 'number'
  ) {
    return {
      mode: defaultBlend.mode as BlendMode,
      opacity: defaultBlend.opacity,
    };
  }
  return {
    mode: DEFAULT_BLEND_PROPERTIES.mode,
    opacity: DEFAULT_BLEND_PROPERTIES.opacity,
  };
};

export const createSafeTraitSetConfig = (
  layerConfig: LayerConfig | undefined,
  layerIndex: number,
  _setId: string
) => {
  return {
    enabled: true,
    value: 0,
    blend: createSafeBlendObject(layerConfig?.defaultBlend),
    zIndex: layerIndex * 100,
  };
};

export const emitSetsUpdated = async () => {
  try {
    await emit('sets-updated');
  } catch (error) {
    console.error('Error emitting sets-updated event:', error);
  }
};

export const updatePossibleCombinations = async (
  store: {
    get: () => { activeSetId?: string | null };
    set: (state: { possibleCombinations: number }) => void;
  },
  operation: string
) => {
  try {
    const activeSetId = store.get().activeSetId ?? 'set1';
    const combinations = await useCombinationsStore
      .getState()
      .calculatePossibleCombinations(activeSetId);
    store.set({ possibleCombinations: combinations });
    return combinations;
  } catch (err) {
    console.error(`Error calculating combinations after ${operation}:`, err);
    return 0;
  }
};

export const getNextSetId = (sets: Record<string, SetInfo>): string => {
  const existingSetIds = Object.keys(sets)
    .filter((id) => id.startsWith('set'))
    .map((id) => {
      const match = id.match(/^set(\d+)$/);
      return match ? parseInt(match[1], 10) : 0;
    })
    .sort((a, b) => a - b);

  let nextSetNumber = 1;
  if (existingSetIds.length > 0) {
    nextSetNumber = existingSetIds[existingSetIds.length - 1] + 1;
  }

  return `set${nextSetNumber}`;
};

export const createUniqueSetName = (baseNumber: number, existingNames: string[]): string => {
  let newSetName = `Set ${baseNumber}`;
  let counter = 1;

  while (existingNames.includes(newSetName)) {
    newSetName = `Set ${baseNumber} (${counter})`;
    counter++;
  }

  return newSetName;
};

export const initializeLayerTraitsForSet = (
  layerConfig: LayerConfig,
  layerIndex: number,
  setId: string
): void => {
  if (!layerConfig?.traits) {
    return;
  }

  layerConfig.sets ??= {};

  layerConfig.sets[setId] = {
    active: true,
  };

  const traitsCount = Object.keys(layerConfig.traits).length;

  Object.values(layerConfig.traits).forEach((trait: TraitConfig) => {
    trait.sets ??= {};

    trait.sets[setId] = createSafeTraitSetConfig(layerConfig, layerIndex, setId);
  });

  if (traitsCount > 0) {
    const totalValue = Object.values(layerConfig.traits).reduce(
      (sum: number, trait: TraitConfig) => sum + (trait.sets?.[setId]?.value ?? 0),
      0
    );

    if (totalValue !== 100) {
      const difference = 100 - totalValue;
      const adjustment = difference / traitsCount;

      Object.values(layerConfig.traits).forEach((trait: TraitConfig) => {
        if (trait.sets?.[setId]) {
          trait.sets[setId].value += adjustment;
          trait.sets[setId].value = Math.round(trait.sets[setId].value * 100) / 100;
        }
      });
    }
  }
};

export const cloneLayerTraitsForSet = (
  layerConfig: LayerConfig,
  sourceSetId: string,
  targetSetId: string
): void => {
  if (!layerConfig?.traits) {
    return;
  }

  layerConfig.sets ??= {};

  layerConfig.sets[targetSetId] = {
    active: layerConfig.sets?.[sourceSetId]?.active ?? true,
    includeInMetadata: layerConfig.sets?.[sourceSetId]?.includeInMetadata,
  };

  Object.values(layerConfig.traits).forEach((trait: TraitConfig) => {
    trait.sets ??= {};

    trait.sets[targetSetId] = {
      ...createSafeTraitSetConfig(layerConfig, 0, targetSetId),
      enabled: trait.sets?.[sourceSetId]?.enabled ?? false,
      includeInMetadata: trait.sets?.[sourceSetId]?.includeInMetadata,
      value: trait.sets?.[sourceSetId]?.value ?? 0,
      zIndex: trait.sets?.[sourceSetId]?.zIndex ?? 0,
      blend: trait.sets?.[sourceSetId]?.blend ?? createSafeBlendObject(layerConfig.defaultBlend),
    };
  });
};

export const cleanSetReferencesInRarityConfig = (
  rarityConfig: RarityConfig | undefined,
  setId: string
): void => {
  if (!rarityConfig) {
    return;
  }

  Object.keys(rarityConfig).forEach((layerName) => {
    const layerConfig = rarityConfig[layerName];
    if (!layerConfig) {
      return;
    }

    if (layerConfig.sets?.[setId]) {
      delete layerConfig.sets[setId];
    }

    if (layerConfig.traits) {
      Object.keys(layerConfig.traits).forEach((traitName) => {
        const traitConfig = layerConfig.traits?.[traitName];
        if (traitConfig?.sets?.[setId]) {
          delete traitConfig.sets[setId];
        }
      });
    }
  });
};

export const updateZIndexInRarityConfig = (
  rarityConfig: RarityConfig | undefined,
  layers: string[],
  setId: string
): RarityConfig => {
  if (!rarityConfig) {
    return {};
  }

  const newRarityConfig = { ...rarityConfig };

  layers.forEach((layerName, index) => {
    const layerConfig = newRarityConfig[layerName];
    if (layerConfig?.traits) {
      Object.values(layerConfig.traits).forEach((trait: TraitConfig) => {
        trait.sets ??= {};

        if (!trait.sets[setId]) {
          const existingSets = Object.keys(trait.sets);
          const defaultSetId = existingSets.length > 0 ? existingSets[0] : '';

          trait.sets[setId] = {
            blend: createSafeBlendObject(layerConfig.defaultBlend),
            zIndex: index * 100,
            enabled: defaultSetId ? (trait.sets[defaultSetId]?.enabled ?? false) : false,
            value: 0,
          };
        } else {
          trait.sets[setId].zIndex = index * 100;
        }
      });
    }
  });

  return newRarityConfig;
};

export const distributeValuesAmongTraits = (traits: Record<string, TraitConfig>, setId: string) => {
  const enabledTraits = Object.values(traits).filter((trait) => trait.sets?.[setId]?.enabled);
  const traitCount = enabledTraits.length;

  if (traitCount === 0) {
    return;
  }

  const valuePerTrait = 100 / traitCount;

  enabledTraits.forEach((trait) => {
    if (trait.sets?.[setId]) {
      trait.sets[setId].value = valuePerTrait;
    }
  });

  const totalValue = enabledTraits.reduce(
    (sum, trait) => sum + (trait.sets?.[setId]?.value ?? 0),
    0
  );

  if (totalValue !== 100 && traitCount > 0) {
    const difference = 100 - totalValue;
    const adjustment = difference / traitCount;

    enabledTraits.forEach((trait) => {
      if (trait.sets?.[setId]) {
        trait.sets[setId].value += adjustment;
        trait.sets[setId].value = Math.round(trait.sets[setId].value * 100) / 100;
      }
    });
  }
};

export const ensureLayerAndTraitsConsistency = (
  rarityConfig: RarityConfig,
  setId: string
): RarityConfig => {
  const configCopy = JSON.parse(JSON.stringify(rarityConfig)) as RarityConfig;

  Object.entries(configCopy).forEach(([, layerConfig]) => {
    const typedLayerConfig = layerConfig;

    typedLayerConfig.sets ??= {};

    if (!typedLayerConfig.sets[setId]) {
      typedLayerConfig.sets[setId] = {
        active: false,
        includeInMetadata: false,
      };
    }

    typedLayerConfig.sets[setId].active = Boolean(typedLayerConfig.sets[setId].active);

    if (!typedLayerConfig.sets[setId].active && typedLayerConfig.traits) {
      Object.entries(typedLayerConfig.traits).forEach(([, traitConfig]) => {
        const typedTraitConfig = traitConfig;

        typedTraitConfig.sets ??= {};
        if (!typedTraitConfig.sets[setId]) {
          typedTraitConfig.sets[setId] = {
            ...createSafeTraitSetConfig(typedLayerConfig, 0, setId),
            enabled: false,
          };
        }

        typedTraitConfig.sets[setId].enabled = false;
      });
    }
  });

  return configCopy;
};

export const redistributeTraitValue = (
  layerConfig: LayerConfig,
  traitName: string,
  oldValue: number,
  setId: string
) => {
  if (!layerConfig.traits) {
    return;
  }

  const otherEnabledTraits = Object.entries(layerConfig.traits).filter(
    ([name, trait]) => name !== traitName && trait.sets?.[setId]?.enabled
  );

  if (otherEnabledTraits.length > 0) {
    const valueToDistribute = oldValue / otherEnabledTraits.length;

    otherEnabledTraits.forEach(([, trait]) => {
      const typedTrait = trait;

      typedTrait.sets ??= {};
      if (!typedTrait.sets[setId]) {
        const layerIndex = 0;

        typedTrait.sets[setId] = createSafeTraitSetConfig(layerConfig, layerIndex, setId);
      }

      typedTrait.sets[setId].value += valueToDistribute;

      if (typedTrait.sets[setId].value > 100) {
        typedTrait.sets[setId].value = 100;
      }

      typedTrait.sets[setId].value = Math.round(typedTrait.sets[setId].value * 100) / 100;
    });
  }
};

export const updateExpandedLayersForExpandAll = (
  expandedLayers: Record<string, Record<string, boolean | unknown>>,
  rarityConfig: RarityConfig | undefined,
  setId: string
): Record<string, Record<string, boolean | unknown>> => {
  if (!rarityConfig) {
    return expandedLayers;
  }

  const newExpandedLayers = { ...expandedLayers };

  if (!newExpandedLayers[setId]) {
    newExpandedLayers[setId] = {};
  } else {
    newExpandedLayers[setId] = { ...newExpandedLayers[setId] };
  }

  Object.entries(rarityConfig).forEach(([layer, config]) => {
    if (config?.sets?.[setId]?.active) {
      newExpandedLayers[setId][layer] = true;
    }
  });
  return newExpandedLayers;
};

export const updateExpandedLayersForCollapseAll = (
  expandedLayers: Record<string, Record<string, boolean | unknown>>,
  rarityConfig: RarityConfig | undefined,
  setId: string
): Record<string, Record<string, boolean | unknown>> => {
  if (!rarityConfig) {
    return expandedLayers;
  }

  const newExpandedLayers = { ...expandedLayers };

  if (!newExpandedLayers[setId]) {
    newExpandedLayers[setId] = {};
  } else {
    newExpandedLayers[setId] = { ...newExpandedLayers[setId] };
  }

  Object.keys(rarityConfig).forEach((layer) => {
    newExpandedLayers[setId][layer] = false;
  });

  return newExpandedLayers;
};

export const addLayerToRarityConfig = (
  rarityConfig: RarityConfig,
  layer: string,
  setId: string
): RarityConfig => {
  const updatedRarityConfig = { ...rarityConfig };

  if (!updatedRarityConfig[layer]) {
    updatedRarityConfig[layer] = {
      sets: {
        [setId]: {
          active: true,
        },
      },
      traits: undefined,
      defaultBlend: DEFAULT_BLEND_PROPERTIES,
    };
  } else {
    const layerConfig = updatedRarityConfig[layer];
    if (!layerConfig.sets) {
      layerConfig.sets = {
        [setId]: {
          active: true,
        },
      };
    } else if (!layerConfig.sets[setId]) {
      layerConfig.sets[setId] = {
        active: true,
      };
    }
  }

  return updatedRarityConfig;
};

export const processLoadedPersistedState = (data: {
  sets?: Record<string, SetInfo>;
  activeSetId?: string;
  expandedLayers?: Record<string, Record<string, boolean>>;
  forcedTraits?: Record<string, Record<string, string>>;
}) => {
  if (!data) {
    return {};
  }

  const freshSets: Record<string, SetInfo> = {};

  if (data.sets && Object.keys(data.sets).length > 0) {
    Object.entries(data.sets).forEach(([id, setInfo]) => {
      if (!setInfo.customName && !setInfo.name) {
        freshSets[id] = {
          ...setInfo,
          customName: id,
          layers: Array.isArray(setInfo.layers) ? [...setInfo.layers] : [],
        };
      } else {
        freshSets[id] = {
          ...setInfo,
          customName: setInfo.customName ?? setInfo.name ?? id,
          layers: Array.isArray(setInfo.layers) ? [...setInfo.layers] : [],
        };
      }
    });
  }

  const activeSetId =
    data.activeSetId ?? (Object.keys(freshSets).length > 0 ? Object.keys(freshSets)[0] : 'set1');

  return {
    sets: freshSets,
    activeSetId,
    expandedLayers: data.expandedLayers ?? {},
    forcedTraits: data.forcedTraits ?? {},
  };
};

export const activateAllLayers = (
  rarityConfig: RarityConfig,
  sets: Record<string, SetInfo>,
  setId: string
): RarityConfig => {
  const newRarityConfig = JSON.parse(JSON.stringify(rarityConfig)) as RarityConfig;

  Object.keys(newRarityConfig).forEach((layer) => {
    const layerConfig = (newRarityConfig as Record<string, LayerConfig>)[layer];

    layerConfig.sets ??= {};

    if (!layerConfig.sets[setId]) {
      layerConfig.sets[setId] = { active: true };
    } else {
      layerConfig.sets[setId].active = true;
    }

    layerConfig.traits ??= {};

    const traits = layerConfig.traits as Record<string, TraitConfig>;
    const _traits = Object.keys(traits);
    const traitCount = _traits.length;

    if (traitCount > 0) {
      const valuePerTrait = 100 / traitCount;

      _traits.forEach((traitName) => {
        const trait = traits[traitName];

        trait.sets ??= {};

        if (!trait.sets[setId]) {
          const layerIndex = sets[setId]?.layers.indexOf(layer) ?? 0;
          trait.sets[setId] = createSafeTraitSetConfig(layerConfig, layerIndex, setId);
        } else {
          trait.sets[setId].enabled = true;
          trait.sets[setId].value = valuePerTrait;
        }

        trait.sets[setId].value = Math.round(trait.sets[setId].value * 100) / 100;
      });

      const totalValue = _traits.reduce(
        (sum, traitName) => sum + (traits[traitName].sets[setId]?.value ?? 0),
        0
      );

      if (totalValue !== 100) {
        const difference = 100 - totalValue;
        const adjustment = difference / traitCount;

        _traits.forEach((traitName) => {
          const trait = traits[traitName];
          if (trait.sets?.[setId]) {
            trait.sets[setId].value += adjustment;
            trait.sets[setId].value = Math.round(trait.sets[setId].value * 100) / 100;
          }
        });
      }
    }
  });

  return newRarityConfig;
};

export const deactivateAllLayers = (rarityConfig: RarityConfig, setId: string): RarityConfig => {
  const newRarityConfig = JSON.parse(JSON.stringify(rarityConfig)) as RarityConfig;

  Object.keys(newRarityConfig).forEach((layer) => {
    const layerConfig = (newRarityConfig as Record<string, LayerConfig>)[layer];

    layerConfig.sets ??= {};

    if (!layerConfig.sets[setId]) {
      layerConfig.sets[setId] = { active: false };
    }

    layerConfig.sets[setId].active = false;

    layerConfig.traits ??= {};

    const traits = layerConfig.traits as Record<string, TraitConfig>;
    Object.keys(traits).forEach((traitName) => {
      const trait = traits[traitName];

      if (!trait.sets) {
        trait.sets = {};
      }

      if (!trait.sets[setId]) {
        trait.sets[setId] = {
          ...createSafeTraitSetConfig(layerConfig, 0, setId),
          enabled: false,
        };
      } else {
        trait.sets[setId].enabled = false;
      }
    });
  });

  return newRarityConfig;
};

export const getActiveLayersFromConfig = (
  rarityConfig: RarityConfig | undefined,
  setId: string
): string[] => {
  if (!rarityConfig) {
    return [];
  }

  const allLayers = Object.keys(rarityConfig);
  return allLayers.filter((layer) => {
    const config = rarityConfig[layer];
    return config?.sets?.[setId]?.active === true;
  });
};

export const ensureMutableSets = (sets: Record<string, SetInfo>): Record<string, SetInfo> => {
  const result: Record<string, SetInfo> = {};

  Object.entries(sets).forEach(([id, setInfo]) => {
    result[id] = {
      id: setInfo.id,
      name: setInfo.name,
      customName: setInfo.customName ?? setInfo.name ?? id,
      createdAt: setInfo.createdAt,
      layers: Array.isArray(setInfo.layers) ? [...setInfo.layers] : [],
      nftCount: setInfo.nftCount ?? 10,
    };
  });

  return result;
};
