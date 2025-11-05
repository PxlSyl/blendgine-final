import type { BlendProperties, LayerConfig, TraitConfig } from '@/types/effect';

import { DEFAULT_BLEND_PROPERTIES } from '@/types/blendModes';

import { useLayerOrderStore } from '@/components/store/layerOrder/main';

export function initializeLayerConfig(traits: string[], layerName: string): LayerConfig {
  const traitCount = traits.length;
  const equalValue = 100 / traitCount;
  const defaultBlend: BlendProperties = { ...DEFAULT_BLEND_PROPERTIES };
  const layerOrderStore = useLayerOrderStore.getState();

  const availableSetIds =
    Object.keys(layerOrderStore.sets).length > 0 ? Object.keys(layerOrderStore.sets) : ['set1'];

  const traitConfig = traits.reduce(
    (acc, trait) => {
      acc[trait] = {
        sets: availableSetIds.reduce((sets, setId) => {
          sets[setId] = {
            blend: { ...defaultBlend },
            zIndex: getDefaultZIndex(layerName, setId),
            enabled: true,
            value: equalValue,
            includeInMetadata: true,
          };
          return sets;
        }, {}),
      };
      return acc;
    },
    {} as Record<string, TraitConfig>
  );

  traitConfig['None'] = {
    sets: availableSetIds.reduce((sets, setId) => {
      sets[setId] = {
        enabled: false,
        locked: false,
        blend: { ...defaultBlend },
        zIndex: getDefaultZIndex(layerName, setId),
        value: 0,
        includeInMetadata: false,
      };
      return sets;
    }, {}),
  };

  return {
    sets: availableSetIds.reduce((sets, setId) => {
      sets[setId] = {
        active: true,
        includeInMetadata: true,
      };
      return sets;
    }, {}),
    traits: traitConfig,
    defaultBlend,
  };
}

export const getDefaultZIndex = (layerName: string, setId: string) => {
  const layerOrder = useLayerOrderStore.getState().sets[setId]?.layers || [];
  const layerIndex = layerOrder.indexOf(layerName);
  return layerIndex >= 0 ? layerIndex * 100 : layerOrder.length * 100;
};
