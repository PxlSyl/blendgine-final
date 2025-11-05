import type {
  LayerConfig,
  RarityConfig,
  TraitConfig,
  ForcedCombinations,
  ForcedCombinationsBySets,
} from '@/types/effect';
import {
  DEFAULT_BLEND_PROPERTIES,
  BlendProperties,
  BlendMode,
  BLEND_MODES,
  VALID_BLEND_MODES,
} from '@/types/blendModes';

import { useLayerOrderStore } from '@/components/store/layerOrder/main';

type StringKey = string;

export const getLayerZIndex = (layerName: string, setId: StringKey) => {
  const layerOrder = useLayerOrderStore.getState().sets[setId]?.layers || [];
  const layerIndex = layerOrder.indexOf(layerName);
  return layerIndex >= 0 ? layerIndex * 100 : layerOrder.length * 100;
};

export const ensureStringKey = (key: unknown): StringKey => {
  return String(key);
};

export function safeGet<T, K>(obj: T, key: K): unknown {
  if (!obj) {
    return undefined;
  }
  const stringKey = String(key);
  return (obj as Record<string, unknown>)[stringKey];
}

export function safeSet<T, K, V>(obj: T, key: K, value: V): void {
  if (!obj) {
    return;
  }
  const stringKey = String(key);
  (obj as Record<string, unknown>)[stringKey] = value;
}

export function getSetsValue(
  obj: unknown,
  setKey: unknown,
  defaultValue: unknown = undefined
): unknown {
  if (!obj) {
    return defaultValue;
  }
  const sets = safeGet(obj, 'sets');
  if (!sets) {
    return defaultValue;
  }
  return safeGet(sets, setKey) ?? defaultValue;
}

export function setSetsValue(obj: unknown, setKey: unknown, propKey: string, value: unknown): void {
  if (!obj) {
    return;
  }
  const sets = safeGet(obj, 'sets');
  if (!sets) {
    return;
  }
  const setObj = safeGet(sets, setKey);
  if (!setObj) {
    return;
  }
  safeSet(setObj, propKey, value);
}

export function getFirstForcedTrait(forcedTraits: string[]): string {
  return forcedTraits && forcedTraits.length > 0 ? forcedTraits[0] : '';
}

export function getLowerLayer(layer1: string, layer2: string): string {
  const layerOrderStore = useLayerOrderStore.getState();
  const { activeSetId } = layerOrderStore;
  const currentSetId = activeSetId ?? 'set1';
  const layers = layerOrderStore.sets[currentSetId]?.layers ?? [];

  const index1 = layers.indexOf(layer1);
  const index2 = layers.indexOf(layer2);

  if (index1 === -1) {
    return layer2;
  }
  if (index2 === -1) {
    return layer1;
  }

  return index1 <= index2 ? layer1 : layer2;
}

export const getCurrentSetId = (): string => {
  const { activeSetId } = useLayerOrderStore.getState();
  return activeSetId ?? 'set1';
};

export const normalizeValue = (value: number): number => {
  const rounded = Math.round(value * 100) / 100;
  return Math.max(0, Math.min(100, rounded));
};

export const getLayerConfig = (layer: string): LayerConfig | undefined => {
  const { rarityConfig } = useLayerOrderStore.getState();
  return rarityConfig?.[layer] as LayerConfig | undefined;
};

export const ensureTraitSets = (trait: TraitConfig, setId: string): void => {
  if (!trait.sets) {
    trait.sets = {};
  }

  if (!trait.sets[setId]) {
    trait.sets[setId] = {
      blend: ensureValidBlend(),
      zIndex: 0,
      enabled: false,
      value: 0,
    };
  }
};

export const getActiveTraits = (
  traits: Record<string, TraitConfig>,
  setId: string
): [string, TraitConfig][] => {
  if (!isTraitConfigRecord(traits)) {
    return [];
  }

  return Object.entries(traits).filter(([, config]) => config.sets?.[setId]?.enabled === true);
};

export const getUnlockedActiveTraits = (
  traits: Record<string, TraitConfig>,
  setId: string
): [string, TraitConfig][] => {
  return Object.entries(traits).filter(
    ([, config]) => !config.sets?.[setId]?.locked && config.sets?.[setId]?.enabled === true
  );
};

const arrayToRecord = <T>(arr: [string, T][]): Record<string, T> => {
  return Object.fromEntries(arr);
};

export const calculateTotalValue = (
  traits: Record<string, TraitConfig> | [string, TraitConfig][],
  setId: string
): number => {
  if (!traits) {
    return 0;
  }

  const traitsRecord = Array.isArray(traits) ? arrayToRecord(traits) : traits;

  return Object.values(traitsRecord).reduce(
    (sum, config) => sum + (config.sets[setId]?.value || 0),
    0
  );
};

export const redistributeExcessValue = (
  traits: Record<string, TraitConfig>,
  activeTraits: [string, TraitConfig][],
  selectedTrait: string,
  excess: number,
  setId: string
): void => {
  const otherTraits = activeTraits.filter(([t]) => t !== selectedTrait);
  const otherTotal = calculateTotalValue(otherTraits, setId);

  if (otherTotal > 0) {
    otherTraits.forEach(([t, config]) => {
      const adjustmentRatio = (config.sets[setId]?.value || 0) / otherTotal;
      const newTraitValue = normalizeValue(
        (config.sets[setId]?.value || 0) - excess * adjustmentRatio
      );

      ensureTraitSets(traits[t], setId);
      traits[t].sets[setId] = {
        ...config.sets[setId],
        value: newTraitValue,
      };
    });
  }
};

export const normalizeAllTraitValues = (
  traits: Record<string, TraitConfig>,
  setId: string
): void => {
  if (!isTraitConfigRecord(traits)) {
    return;
  }

  Object.keys(traits).forEach((t) => {
    ensureTraitSets(traits[t], setId);

    if (traits[t].sets[setId]) {
      traits[t].sets[setId] = {
        ...traits[t].sets[setId],
        value: normalizeValue(traits[t].sets[setId].value || 0),
      };
    }
  });
};

export const isLayerLocked = (layerConfig: LayerConfig, setId: string): boolean => {
  return !!layerConfig?.sets?.[setId]?.locked;
};

export const isTraitLocked = (traitConfig: TraitConfig, setId: string): boolean => {
  return !!traitConfig?.sets?.[setId]?.locked;
};

export const isTraitEnabled = (traitConfig: TraitConfig, setId: string): boolean => {
  return !!traitConfig?.sets?.[setId]?.enabled;
};

export const distributeEquallyAmongTraits = (
  traits: Record<string, TraitConfig>,
  traitEntries: [string, TraitConfig][],
  availablePercentage: number,
  setId: string
): void => {
  if (!isTraitConfigRecord(traits) || !Array.isArray(traitEntries) || traitEntries.length === 0) {
    return;
  }

  const equalValue = parseFloat((availablePercentage / traitEntries.length).toFixed(2));

  traitEntries.forEach(([traitName], index) => {
    ensureTraitSets(traits[traitName], setId);

    if (index === traitEntries.length - 1) {
      const sumOthers = traitEntries
        .slice(0, -1)
        .reduce((sum, [t]) => sum + (traits[t].sets?.[setId]?.value || 0), 0);

      traits[traitName].sets[setId].value = parseFloat(
        (availablePercentage - sumOthers).toFixed(2)
      );
    } else {
      traits[traitName].sets[setId].value = equalValue;
    }
  });
};

export const calculateLockedTotal = (
  traits: Record<string, TraitConfig>,
  setId: string
): number => {
  if (!isTraitConfigRecord(traits)) {
    return 0;
  }

  return Object.entries(traits).reduce(
    (sum, [, traitConfig]) =>
      sum +
      (traitConfig.sets?.[setId]?.locked && traitConfig.sets?.[setId]?.enabled
        ? traitConfig.sets[setId].value
        : 0),
    0
  );
};

export const ensureValidBlend = (blend?: unknown): BlendProperties => {
  if (!blend || typeof blend !== 'object') {
    return { ...DEFAULT_BLEND_PROPERTIES };
  }

  const blendObj = blend as Record<string, unknown>;
  const isValidBlendMode = (mode: unknown): mode is BlendMode => {
    return typeof mode === 'string' && Object.keys(BLEND_MODES).includes(mode);
  };

  return {
    mode: isValidBlendMode(blendObj.mode) ? blendObj.mode : DEFAULT_BLEND_PROPERTIES.mode,
    opacity:
      typeof blendObj.opacity === 'number' ? blendObj.opacity : DEFAULT_BLEND_PROPERTIES.opacity,
  };
};

export const ensureNoneTrait = (
  traits: Record<string, TraitConfig>,
  layerConfig: LayerConfig,
  setId: string
): void => {
  const defaultBlend = ensureValidBlend(layerConfig.defaultBlend);

  if (!traits['None']) {
    traits['None'] = {
      sets: {},
    };
  }

  if (!traits['None'].sets) {
    traits['None'].sets = {};
  }

  if (!traits['None'].sets[setId]) {
    traits['None'].sets[setId] = {
      blend: defaultBlend,
      zIndex: getLayerZIndex('None', setId),
      enabled: false,
      value: 0,
    };
  }
};

export const scaleTraitValues = (
  traits: Record<string, TraitConfig>,
  traitNames: string[],
  scaleFactor: number,
  setId: string
): void => {
  traitNames.forEach((traitName) => {
    if (!traits[traitName].sets[setId]) {
      return;
    }

    traits[traitName].sets[setId].value =
      Math.round(traits[traitName].sets[setId].value * scaleFactor * 100) / 100;
  });
};

export const applyRedistributionToLastTrait = (
  traits: Record<string, TraitConfig>,
  traitNames: string[],
  totalValue: number,
  setId: string
): void => {
  if (traitNames.length === 0) {
    return;
  }

  const lastTraitName = traitNames[traitNames.length - 1];
  traits[lastTraitName].sets[setId].value = parseFloat(
    (traits[lastTraitName].sets[setId].value + (100 - totalValue)).toFixed(2)
  );
};

export const ensureSetConfig = (config: LayerConfig, setId: string): void => {
  config.sets ??= {};

  if (!config.sets[setId]) {
    config.sets[setId] = {
      active: false,
      locked: false,
    };
  }
};

export const ensureTraitSetConfig = (
  config: LayerConfig,
  trait: string,
  setId: string,
  defaultZIndex: number = 0
): void => {
  config.traits ??= {};

  if (!config.traits[trait]) {
    config.traits[trait] = { sets: {} };
  }

  if (!config.traits[trait].sets) {
    config.traits[trait].sets = {};
  }

  if (!config.traits[trait].sets[setId]) {
    config.traits[trait].sets[setId] = {
      blend: ensureValidBlend(config.defaultBlend),
      zIndex: defaultZIndex,
      enabled: false,
      value: 0,
      locked: false,
    };
  }
};

export const toggleTraitLock = (
  config: RarityConfig,
  layer: string,
  trait: string,
  setId: string
): void => {
  if (!config) {
    return;
  }

  ensureTraitSetConfig(config[layer], trait, setId);

  if (config[layer]?.traits?.[trait]?.sets?.[setId]) {
    config[layer].traits[trait].sets[setId].locked =
      !config[layer].traits[trait].sets[setId].locked;
  }
};

export const toggleLayerLock = (config: RarityConfig, layer: string, setId: string): void => {
  if (!config) {
    return;
  }

  ensureSetConfig(config[layer], setId);

  if (config[layer]?.sets?.[setId]) {
    config[layer].sets[setId].locked = !config[layer].sets[setId].locked;
  }
};

export const redistributeRemainingRarity = (
  traits: Record<string, TraitConfig>,
  enabledTraits: [string, TraitConfig][],
  totalValue: number,
  setId: string
): void => {
  const equalValue = parseFloat((totalValue / enabledTraits.length).toFixed(2));

  enabledTraits.forEach(([trait], index) => {
    if (index === enabledTraits.length - 1) {
      const sumOthers = enabledTraits
        .slice(0, -1)
        .reduce((sum, [t]) => sum + traits[t].sets[setId].value, 0);
      traits[trait].sets[setId].value = parseFloat((totalValue - sumOthers).toFixed(2));
    } else {
      traits[trait].sets[setId].value = equalValue;
    }
  });
};

export const findForcedTraitsForLayer = (
  forcedCombinations: ForcedCombinations,
  layer: string
): Set<string> => {
  if (!forcedCombinations?.[layer]) {
    return new Set();
  }
  return new Set(Object.keys(forcedCombinations[layer]));
};

export const adjustTraitValue = (
  config: TraitConfig,
  setId: string,
  step: number,
  action: 'increase' | 'decrease' | 'setMin' | 'setMax' | number
): number => {
  const currentValue = config.sets[setId]?.value || 0;

  if (typeof action === 'number') {
    return action;
  } else if (action === 'increase') {
    return Math.min(100, currentValue + step);
  } else if (action === 'decrease') {
    return Math.max(0, currentValue - step);
  } else if (action === 'setMin') {
    return 0;
  } else if (action === 'setMax') {
    return 100;
  }

  return currentValue;
};

export const resetTraitValues = (
  traits: Record<string, TraitConfig>,
  setId: string,
  preserveLocked: boolean = true
): void => {
  Object.entries(traits).forEach(([trait, config]) => {
    if (preserveLocked && config.sets[setId]?.locked) {
      return;
    }

    if (trait === 'None') {
      if (config.sets[setId]) {
        config.sets[setId] = {
          ...config.sets[setId],
          enabled: false,
          value: 0,
        };
      }
    } else if (config.sets[setId]?.enabled) {
      config.sets[setId] = {
        ...config.sets[setId],
        value: 0,
      };
    }
  });
};

export const adjustForcedCombination = (
  config: RarityConfig,
  lowerLayer: string,
  lowerTrait: string,
  upperLayer: string,
  upperTrait: string,
  setId: string
): boolean => {
  if (!config) {
    return false;
  }

  const lowerConfig = config[lowerLayer]?.traits?.[lowerTrait];
  const upperConfig = config[upperLayer]?.traits?.[upperTrait];

  if (!lowerConfig?.sets || !upperConfig?.sets) {
    return false;
  }

  const lowerSetConfig = lowerConfig.sets[setId];
  const upperSetConfig = upperConfig.sets[setId];

  if (!lowerSetConfig || !upperSetConfig) {
    return false;
  }

  const lowerValue = Number(lowerSetConfig.value) || 0;
  const upperValue = Number(upperSetConfig.value) || 0;

  if (upperValue > lowerValue) {
    upperSetConfig.value = lowerValue;
    return true;
  }

  return false;
};

export const checkAllZero = (traits: Record<string, TraitConfig>, setId: string): boolean => {
  if (!isTraitConfigRecord(traits)) {
    return true;
  }

  return Object.entries(traits).every(
    ([, config]) => !config.sets?.[setId]?.enabled || config.sets?.[setId]?.value === 0
  );
};

export const initializeNoneTrait = (
  layerConfig: LayerConfig,
  traits: Record<string, TraitConfig>,
  currentSetId: string
): void => {
  if (!layerConfig || !traits || !currentSetId) {
    console.warn('Invalid parameters provided to initializeNoneTrait');
    return;
  }

  if (!traits['None']) {
    traits['None'] = {
      sets: {
        [currentSetId]: {
          blend: { ...DEFAULT_BLEND_PROPERTIES },
          zIndex: 0,
          enabled: false,
          value: 0,
        },
      },
    };
  }
};

export const distributeEqualValuesAmongTraits = (
  traits: Record<string, TraitConfig>,
  enabledTraits: [string, TraitConfig][],
  currentSetId: string
): void => {
  if (!isTraitConfigRecord(traits) || !Array.isArray(enabledTraits) || enabledTraits.length === 0) {
    return;
  }

  const equalValue = parseFloat((100 / enabledTraits.length).toFixed(2));

  enabledTraits.forEach(([trait], index) => {
    if (index === enabledTraits.length - 1) {
      const sumOthers = enabledTraits
        .slice(0, -1)
        .reduce((sum, [t]) => sum + traits[t].sets[currentSetId].value, 0);
      traits[trait].sets[currentSetId].value = parseFloat((100 - sumOthers).toFixed(2));
    } else {
      traits[trait].sets[currentSetId].value = equalValue;
    }
  });
};

export const redistributeNoneValueProportionally = (
  traits: Record<string, TraitConfig>,
  nonNoneTraits: [string, TraitConfig][],
  previousNoneValue: number,
  currentSetId: string
): void => {
  if (!isTraitConfigRecord(traits) || !Array.isArray(nonNoneTraits) || nonNoneTraits.length === 0) {
    return;
  }

  const totalTraits = nonNoneTraits.length + 1;
  const equalValue = parseFloat((100 / totalTraits).toFixed(2));

  nonNoneTraits.forEach(([trait], index) => {
    if (index === nonNoneTraits.length - 1) {
      const sumOthers = nonNoneTraits
        .slice(0, -1)
        .reduce((sum, [t]) => sum + traits[t].sets[currentSetId].value, 0);
      traits[trait].sets[currentSetId].value = parseFloat(
        (100 - equalValue - sumOthers).toFixed(2)
      );
    } else {
      traits[trait].sets[currentSetId].value = equalValue;
    }
  });

  traits['None'].sets[currentSetId].value = equalValue;
};

export const distributeValueEqually = (
  traits: Record<string, TraitConfig>,
  enabledTraits: [string, TraitConfig][],
  totalValue: number,
  currentSetId: string
): void => {
  if (!isTraitConfigRecord(traits) || !Array.isArray(enabledTraits) || enabledTraits.length === 0) {
    return;
  }

  const valuePerTrait = totalValue / enabledTraits.length;

  enabledTraits.forEach(([trait], index) => {
    if (index === enabledTraits.length - 1) {
      const sumOthers = enabledTraits
        .slice(0, -1)
        .reduce((sum, [t]) => sum + traits[t].sets[currentSetId].value, 0);
      traits[trait].sets[currentSetId].value = parseFloat((totalValue - sumOthers).toFixed(2));
    } else {
      traits[trait].sets[currentSetId].value = parseFloat(valuePerTrait.toFixed(2));
    }
  });
};

export const adjustForcedTraitValues = (
  config: RarityConfig,
  layerConfig: LayerConfig,
  layer: string,
  forcedCombosForLayer: Record<string, Record<string, string[]>>,
  currentSetId: string
): { totalForcedRarity: number; forcedTraits: Set<string> } => {
  const forcedTraits = new Set(Object.keys(forcedCombosForLayer));
  let totalForcedRarity = 0;

  Object.entries(forcedCombosForLayer).forEach(([trait, forcedLayers]) => {
    Object.entries(forcedLayers).forEach(([otherLayer, forcedTraits]) => {
      const lowerLayer = getLowerLayer(layer, otherLayer);
      const upperLayer = lowerLayer === layer ? otherLayer : layer;

      const forcedTraitName = getFirstForcedTrait(forcedTraits);

      const lowerTrait = lowerLayer === layer ? trait : forcedTraitName;
      const upperTrait = lowerLayer === layer ? forcedTraitName : trait;

      const activeSetKey = ensureStringKey(currentSetId);
      const lowerRarity =
        lowerLayer === layer
          ? (layerConfig?.traits?.[lowerTrait]?.sets?.[activeSetKey]?.value ?? 0)
          : (config?.[lowerLayer]?.traits?.[lowerTrait]?.sets?.[activeSetKey]?.value ?? 0);
      const upperRarity =
        upperLayer === layer
          ? (layerConfig?.traits?.[upperTrait]?.sets?.[activeSetKey]?.value ?? 0)
          : (config?.[upperLayer]?.traits?.[upperTrait]?.sets?.[activeSetKey]?.value ?? 0);

      if (upperRarity > lowerRarity) {
        if (upperLayer === layer) {
          const setObj = layerConfig.traits?.[upperTrait]
            ? getSetsValue(layerConfig.traits[upperTrait], activeSetKey)
            : undefined;
          if (setObj && layerConfig.traits?.[upperTrait]) {
            setSetsValue(layerConfig.traits[upperTrait], activeSetKey, 'value', lowerRarity);
          }
        } else {
          const setObj = config?.[upperLayer]?.traits?.[upperTrait]
            ? getSetsValue(config[upperLayer]?.traits[upperTrait], activeSetKey)
            : undefined;
          if (setObj && config?.[upperLayer]?.traits?.[upperTrait]) {
            setSetsValue(config[upperLayer].traits[upperTrait], activeSetKey, 'value', lowerRarity);
          }
        }
      }

      if (lowerLayer === layer) {
        totalForcedRarity += lowerRarity;
      }
    });
  });

  return { totalForcedRarity, forcedTraits };
};

export const redistributeRemainingRarityToNonForcedTraits = (
  traits: Record<string, TraitConfig>,
  nonForcedTraits: [string, TraitConfig][],
  remainingRarity: number,
  currentSetId: string
): void => {
  if (
    !isTraitConfigRecord(traits) ||
    !Array.isArray(nonForcedTraits) ||
    nonForcedTraits.length === 0
  ) {
    return;
  }

  const equalValue = parseFloat((remainingRarity / nonForcedTraits.length).toFixed(2));

  nonForcedTraits.forEach(([trait], index) => {
    if (index === nonForcedTraits.length - 1) {
      const sumOthers = nonForcedTraits
        .slice(0, -1)
        .reduce((sum, [t]) => sum + traits[t].sets[ensureStringKey(currentSetId)].value, 0);
      traits[trait].sets[ensureStringKey(currentSetId)].value = parseFloat(
        (remainingRarity - sumOthers).toFixed(2)
      );
    } else {
      traits[trait].sets[ensureStringKey(currentSetId)].value = equalValue;
    }
  });
};

export const ensureTotalIs100 = (
  traits: Record<string, TraitConfig>,
  enabledTraits: [string, TraitConfig][],
  currentSetId: string
): void => {
  if (!isTraitConfigRecord(traits) || !Array.isArray(enabledTraits) || enabledTraits.length === 0) {
    return;
  }

  const totalValue = enabledTraits.reduce(
    (sum, [, config]) => sum + config.sets[ensureStringKey(currentSetId)].value,
    0
  );

  if (Math.abs(totalValue - 100) > 0.01) {
    const difference = 100 - totalValue;

    if (Math.abs(difference) < 0.1) {
      return;
    }

    const [[firstTrait, { sets: firstSets }]] = enabledTraits;
    const { value: firstValue } = firstSets[ensureStringKey(currentSetId)];
    let maxTrait = firstTrait;
    let maxValue = firstValue;

    enabledTraits.forEach(([trait, config]) => {
      const { sets } = config;
      const { value } = sets[ensureStringKey(currentSetId)];
      if (value > maxValue) {
        maxValue = value;
        maxTrait = trait;
      }
    });

    const newValue = maxValue + difference;
    if (newValue >= 0 && newValue <= 100) {
      traits[maxTrait].sets[ensureStringKey(currentSetId)].value = parseFloat(newValue.toFixed(2));
    }
  }
};

export const areTraitValuesEqual = (
  traits: [string, TraitConfig][],
  currentSetId: string,
  tolerance: number = 0.01
): boolean => {
  if (traits.length <= 1) {
    return true;
  }

  const firstValue = traits[0][1].sets[currentSetId].value;
  return traits.every(
    ([, config]) => Math.abs(config.sets[currentSetId].value - firstValue) <= tolerance
  );
};

export const normalizeLayerTraits = (
  traits: Record<string, TraitConfig>,
  currentSetId: string
): Record<string, TraitConfig> => {
  const normalizedTraits: Record<string, TraitConfig> = {};

  const enabledTraits = getActiveTraits(traits, currentSetId);
  const lockedTraits = Object.entries(traits).filter(
    ([, config]) => config.sets?.[currentSetId]?.locked
  );
  const unlockedEnabledTraits = enabledTraits.filter(
    ([, config]) => !config.sets?.[currentSetId]?.locked
  );

  const lockedTotal = lockedTraits.reduce(
    (sum, [, config]) => sum + (config.sets[currentSetId]?.value || 0),
    0
  );
  const availablePercentage = Math.max(0, 100 - lockedTotal);

  lockedTraits.forEach(([trait, config]) => {
    normalizedTraits[trait] = { ...config };
  });

  if (unlockedEnabledTraits.length > 0) {
    const totalValue = calculateTotalValue(unlockedEnabledTraits, currentSetId);

    if (totalValue === 0) {
      distributeEquallyAmongTraits(
        normalizedTraits,
        unlockedEnabledTraits,
        availablePercentage,
        currentSetId
      );
    } else {
      const scaleFactor = availablePercentage / totalValue;

      unlockedEnabledTraits.forEach(([trait, config]) => {
        normalizedTraits[trait] = {
          ...config,
          sets: {
            ...config.sets,
            [currentSetId]: {
              ...config.sets[currentSetId],
              value: Math.round((config.sets[currentSetId]?.value || 0) * scaleFactor * 100) / 100,
            },
          },
        };
      });
    }

    if (unlockedEnabledTraits.length > 0) {
      const [lastUnlockedTrait] = unlockedEnabledTraits[unlockedEnabledTraits.length - 1];
      const sum = Object.values(normalizedTraits).reduce(
        (acc, trait) => acc + (trait.sets[currentSetId]?.value || 0),
        0
      );

      if (normalizedTraits[lastUnlockedTrait]?.sets[currentSetId]) {
        normalizedTraits[lastUnlockedTrait].sets[currentSetId].value +=
          Math.round((100 - sum) * 100) / 100;
      }
    }
  }

  Object.entries(traits).forEach(([trait, config]) => {
    if (!config.sets[currentSetId]?.enabled) {
      normalizedTraits[trait] = {
        ...config,
        sets: {
          ...config.sets,
          [currentSetId]: {
            ...config.sets[currentSetId],
            value: 0,
          },
        },
      };
    }
  });

  return normalizedTraits;
};

export const processForcedCombinations = (
  config: RarityConfig,
  forcedCombinations: ForcedCombinationsBySets,
  currentSetId: string
): RarityConfig => {
  const updatedConfig = { ...config };

  Object.entries(forcedCombinations).forEach(([layer1, traits1]) => {
    if (typeof traits1 !== 'object' || traits1 === null) {
      return;
    }

    Object.entries(traits1 as Record<string, Record<string, string[]>>).forEach(
      ([trait1, forcedLayers]) => {
        if (typeof forcedLayers !== 'object' || forcedLayers === null) {
          return;
        }

        Object.entries(forcedLayers).forEach(([layer2, forcedTraits]) => {
          if (typeof forcedTraits !== 'object' || forcedTraits === null) {
            return;
          }

          Object.keys(forcedTraits).forEach((trait2) => {
            if (forcedTraits[trait2] === true) {
              const lowerLayer = getLowerLayer(layer1, layer2);
              const upperLayer = lowerLayer === layer1 ? layer2 : layer1;
              const lowerTrait = String(lowerLayer === layer1 ? trait1 : trait2);
              const upperTrait = String(lowerLayer === layer1 ? trait2 : trait1);

              const lowerLayerConfig = updatedConfig[lowerLayer];
              const upperLayerConfig = updatedConfig[upperLayer];

              if (lowerLayerConfig && upperLayerConfig) {
                const lowerTraitSettings = safeGet(lowerLayerConfig.traits, lowerTrait);
                const upperTraitSettings = safeGet(upperLayerConfig.traits, upperTrait);

                if (!lowerTraitSettings || !upperTraitSettings) {
                  return;
                }

                const lowerSetConfig = safeGet(safeGet(lowerTraitSettings, 'sets'), currentSetId);
                const upperSetConfig = safeGet(safeGet(upperTraitSettings, 'sets'), currentSetId);

                if (!lowerSetConfig || !upperSetConfig) {
                  return;
                }

                const isLowerLocked = safeGet(lowerSetConfig, 'locked');
                const isUpperLocked = safeGet(upperSetConfig, 'locked');
                const isLowerEnabled = safeGet(lowerSetConfig, 'enabled');
                const isUpperEnabled = safeGet(upperSetConfig, 'enabled');

                if (!isLowerLocked && !isUpperLocked && isLowerEnabled && isUpperEnabled) {
                  const lowerValue = Number(safeGet(lowerSetConfig, 'value')) || 0;
                  const upperValue = Number(safeGet(upperSetConfig, 'value')) || 0;

                  if (upperValue > lowerValue) {
                    safeSet(upperSetConfig, 'value', lowerValue);

                    const excess = upperValue - lowerValue;

                    if (!upperLayerConfig.traits) {
                      return;
                    }

                    const redistributableTraits = Object.entries(upperLayerConfig.traits).filter(
                      ([t, c]) => {
                        if (t === upperTrait) {
                          return false;
                        }

                        const traitSets = safeGet(c, 'sets');
                        if (!traitSets) {
                          return false;
                        }

                        const traitSetConfig = safeGet(traitSets, currentSetId);
                        if (!traitSetConfig) {
                          return false;
                        }

                        return (
                          !safeGet(traitSetConfig, 'locked') &&
                          safeGet(traitSetConfig, 'enabled') === true
                        );
                      }
                    );

                    if (redistributableTraits.length > 0) {
                      const redistributionValue = excess / redistributableTraits.length;
                      redistributableTraits.forEach(([t]) => {
                        if (!upperLayerConfig.traits?.[t]?.sets?.[ensureStringKey(currentSetId)]) {
                          return;
                        }
                        upperLayerConfig.traits[t].sets[ensureStringKey(currentSetId)].value +=
                          Math.round(redistributionValue * 100) / 100;
                      });
                    }
                  }
                }
              }
            }
          });
        });
      }
    );
  });

  return updatedConfig;
};

export const applyForcedCombinationAdjustments = (
  config: RarityConfig | undefined,
  forcedCombinations: ForcedCombinationsBySets | undefined,
  currentSetId: string
): { updatedConfig: RarityConfig; hasChanges: boolean } => {
  if (!config) {
    return { updatedConfig: {} as RarityConfig, hasChanges: false };
  }

  const updatedConfig = { ...config };
  let hasChanges = false;

  if (!forcedCombinations) {
    return { updatedConfig, hasChanges };
  }

  Object.entries(forcedCombinations).forEach(([lowerLayer, upperLayers]) => {
    if (!updatedConfig[lowerLayer]) {
      return;
    }
    Object.entries(upperLayers as Record<string, Record<string, string[]>>).forEach(
      ([lowerTrait, upperLayerConfigs]) => {
        Object.entries(upperLayerConfigs).forEach(([upperLayer, upperTraits]) => {
          if (!updatedConfig[upperLayer]) {
            return;
          }
          Object.entries(upperTraits).forEach(([upperTrait]) => {
            if (lowerLayer && lowerTrait && upperLayer && upperTrait) {
              const changed = adjustForcedCombination(
                updatedConfig,
                lowerLayer,
                lowerTrait,
                upperLayer,
                upperTrait,
                currentSetId
              );
              if (changed) {
                hasChanges = true;
              }
            }
          });
        });
      }
    );
  });

  return { updatedConfig, hasChanges };
};

export const handleNoneTraitReset = (
  traits: Record<string, TraitConfig>,
  currentSetId: string,
  layerConfig?: LayerConfig
): void => {
  if (!traits['None']) {
    return;
  }

  ensureTraitSets(traits['None'], currentSetId);

  if (isTraitLocked(traits['None'], currentSetId)) {
    return;
  }

  traits['None'].sets[ensureStringKey(currentSetId)] = {
    ...traits['None'].sets[ensureStringKey(currentSetId)],
    enabled: false,
    value: 0,
    blend:
      traits['None'].sets[ensureStringKey(currentSetId)]?.blend ||
      (layerConfig ? layerConfig.defaultBlend : undefined),
    zIndex: traits['None'].sets[ensureStringKey(currentSetId)]?.zIndex || 0,
  };
};

const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

const isTraitConfigRecord = (value: unknown): value is Record<string, TraitConfig> => {
  if (!isObject(value)) {
    return false;
  }
  return Object.values(value).every(
    (trait) => isObject(trait) && 'sets' in trait && isObject(trait.sets)
  );
};

const createDefaultTraitConfig = (): TraitConfig => {
  return {
    sets: {},
  };
};

const defaultBlend = { mode: 'source-over' as const, opacity: 100 };

export const ensureTraitConfigRecord = (traits: unknown): Record<string, TraitConfig> => {
  if (!traits || !isObject(traits)) {
    return {};
  }

  const result: Record<string, TraitConfig> = {};

  Object.entries(traits).forEach(([traitId, trait]) => {
    if (!trait || !isObject(trait)) {
      result[traitId] = createDefaultTraitConfig();
      return;
    }

    const { sets, ...restTrait } = trait;

    result[traitId] = {
      sets: {},
      ...restTrait,
    } as TraitConfig;

    if (sets && isObject(sets)) {
      result[traitId].sets = {};

      Object.entries(sets).forEach(([setId, set]) => {
        if (!set || !isObject(set)) {
          return;
        }

        let blendValue: { mode: BlendMode; opacity: number };
        if (set.blend && isObject(set.blend)) {
          const mode = set.blend.mode ? String(set.blend.mode) : defaultBlend.mode;
          const validMode = isValidBlendMode(mode) ? mode : defaultBlend.mode;

          blendValue = {
            mode: validMode,
            opacity:
              typeof set.blend.opacity === 'number' ? set.blend.opacity : defaultBlend.opacity,
          };
        } else {
          blendValue = { ...defaultBlend };
        }

        result[traitId].sets[setId] = {
          value: typeof set.value === 'number' ? set.value : 0,
          enabled: Boolean(set.enabled),
          zIndex: typeof set.zIndex === 'number' ? set.zIndex : 0,
          includeInMetadata: Boolean(set.includeInMetadata),
          blend: blendValue,
          locked: typeof set.locked === 'boolean' ? set.locked : undefined,
        };
      });
    }
  });

  return result;
};

const isValidBlendMode = (mode: string): mode is BlendMode => {
  return VALID_BLEND_MODES.includes(mode as BlendMode);
};
