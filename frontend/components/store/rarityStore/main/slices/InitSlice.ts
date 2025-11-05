import { StateCreator } from 'zustand';
import * as E from 'effect/Effect';
import { pipe } from 'effect/Function';
import * as A from 'effect/Array';

import type { LayerConfig, TraitConfig } from '@/types/effect';
import { DEFAULT_BLEND_PROPERTIES } from '@/types/blendModes';

import { api } from '@/services';
import { getCurrentSetId } from './utils';
import { useLayerOrderStore } from '@/components/store/layerOrder/main';
import { useProjectSetupStore } from '@/components/store/projectSetup/main';

type LayerResult = {
  layer: string;
  config: LayerConfig;
};

export interface InitSlice {
  initializeRarityConfig: () => Promise<Record<string, LayerConfig>>;
}

const createTraitConfig = (
  traits: string[],
  layerIndex: number,
  currentSetId: string
): Record<string, TraitConfig> => {
  const defaultValue = 100 / traits.length;
  const traitConfig: Record<string, TraitConfig> = {};

  traits.forEach((trait) => {
    const traitName = trait.replace(/\.(png|gif|webp)$/, '');
    traitConfig[traitName] = {
      sets: {
        [currentSetId]: {
          blend: { ...DEFAULT_BLEND_PROPERTIES },
          zIndex: layerIndex + 1,
          enabled: true,
          value: defaultValue,
        },
      },
    };
  });

  if (!traitConfig['None']) {
    traitConfig['None'] = {
      sets: {
        [currentSetId]: {
          blend: { ...DEFAULT_BLEND_PROPERTIES },
          zIndex: layerIndex + 1,
          enabled: false,
          value: 0,
        },
      },
    };
  }

  return traitConfig;
};

const processLayer = (
  layer: string,
  layerIndex: number,
  selectedFolder: string,
  currentSetId: string
): E.Effect<LayerResult | null, Error, never> => {
  return pipe(
    E.tryPromise({
      try: () => api.readTraits(selectedFolder, layer),
      catch: (error) => new Error(`Failed to read traits for layer ${layer}: ${String(error)}`),
    }),
    E.flatMap((traits) =>
      traits.length === 0
        ? E.succeed(null)
        : E.succeed({
            layer,
            config: {
              traits: createTraitConfig(traits, layerIndex, currentSetId),
              defaultBlend: { ...DEFAULT_BLEND_PROPERTIES },
              sets: {
                [currentSetId]: {
                  active: true,
                },
              },
            },
          })
    )
  );
};

export const createInitSlice: StateCreator<InitSlice> = () => ({
  initializeRarityConfig: () => {
    return pipe(
      E.Do,
      E.bind('layerOrderStore', () => E.succeed(useLayerOrderStore.getState())),
      E.bind('projectSetupStore', () => E.succeed(useProjectSetupStore.getState())),
      E.bind('currentSetId', () => E.succeed(getCurrentSetId())),
      E.flatMap(({ layerOrderStore, projectSetupStore, currentSetId }) => {
        if (!projectSetupStore.selectedFolder) {
          return E.succeed({});
        }

        const orderedLayers = layerOrderStore.getOrderedLayers();
        if (orderedLayers.length === 0) {
          return E.succeed({});
        }

        return pipe(
          orderedLayers,
          A.map((layer, index) =>
            processLayer(layer, index, projectSetupStore.selectedFolder || '', currentSetId)
          ),
          E.all,
          E.map((results) =>
            pipe(
              results,
              A.filter((result): result is LayerResult => result !== null),
              A.reduce({} as Record<string, LayerConfig>, (acc, { layer, config }) => {
                acc[layer] = config;
                return acc;
              })
            )
          ),
          E.tap((config) => {
            if (Object.keys(config).length > 0) {
              return pipe(
                E.succeed(
                  layerOrderStore.setRarityConfig({ ...layerOrderStore.rarityConfig, ...config })
                ),
                E.flatMap(() =>
                  E.tryPromise({
                    try: () => layerOrderStore.saveState(),
                    catch: (error) => new Error(`Failed to save state: ${String(error)}`),
                  })
                ),
                E.flatMap(() =>
                  E.tryPromise({
                    try: () => layerOrderStore.saveRarityConfig(),
                    catch: (error) => new Error(`Failed to save rarity config: ${String(error)}`),
                  })
                )
              );
            }
            return E.succeed(undefined);
          })
        );
      }),
      E.runPromise
    );
  },
});
