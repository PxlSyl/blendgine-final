import { Effect } from 'effect';

import { api } from '@/services';

import { useLayerOrderStore } from '@/components/store/layerOrder/main';

export const checkTraitCompatibilityEffect = (
  layerName: string,
  traitName: string,
  selectedTraits: Record<string, string>
) =>
  Effect.gen(function* (_) {
    const layerOrderState = useLayerOrderStore.getState();
    const { activeSetId } = layerOrderState;
    const currentSetId = activeSetId ?? 'set1';
    const allIncompatibilities = yield* _(
      Effect.tryPromise({
        try: () => api.loadIncompatibilityState(),
        catch: (error) => new Error(`Failed to load incompatibility state: ${String(error)}`),
      })
    );
    const incompatibilities = (allIncompatibilities?.[currentSetId] ?? {}) as Record<
      string,
      Record<string, Record<string, string[]>>
    >;

    if (!incompatibilities || Object.keys(incompatibilities).length === 0) {
      return true;
    }

    const traitIncompatibilities = incompatibilities[layerName]?.[traitName] as
      | Record<string, string[]>
      | undefined;
    if (traitIncompatibilities) {
      for (const [otherLayer, incompatibleTraits] of Object.entries(traitIncompatibilities)) {
        const selectedTrait = selectedTraits[otherLayer];
        if (
          selectedTrait &&
          Array.isArray(incompatibleTraits) &&
          incompatibleTraits.includes(selectedTrait)
        ) {
          return false;
        }
      }
    }

    for (const [otherLayer, selectedTrait] of Object.entries(selectedTraits)) {
      const otherIncompatibilities = incompatibilities[otherLayer]?.[selectedTrait] as
        | Record<string, string[]>
        | undefined;
      if (
        otherIncompatibilities?.layerName &&
        Array.isArray(otherIncompatibilities.layerName) &&
        otherIncompatibilities.layerName.includes(traitName)
      ) {
        return false;
      }
    }

    return true;
  });

export const checkForcedCombinationsEffect = (
  layerName: string,
  traitName: string,
  selectedTraits: Record<string, string>,
  orderedLayers: string[]
) =>
  Effect.gen(function* (_) {
    const layerOrderState = useLayerOrderStore.getState();
    const { activeSetId } = layerOrderState;
    const currentSetId = activeSetId ?? 'set1';
    const allForcedCombinations = yield* _(
      Effect.tryPromise({
        try: () => api.loadForcedCombinationState(),
        catch: (error) => new Error(`Failed to load forced combination state: ${String(error)}`),
      })
    );
    const forcedCombinations = (allForcedCombinations?.[currentSetId] ?? {}) as Record<
      string,
      Record<string, Record<string, string[]>>
    >;

    if (!forcedCombinations || Object.keys(forcedCombinations).length === 0) {
      return true;
    }

    const currentLayerIndex = orderedLayers.indexOf(layerName);

    for (let i = 0; i < currentLayerIndex; i++) {
      const lowerLayer = orderedLayers[i];
      const lowerTrait = selectedTraits[lowerLayer];

      if (!lowerTrait) {
        continue;
      }

      const forcedTraitsForLower = forcedCombinations[lowerLayer]?.[lowerTrait]?.[layerName] as
        | string[]
        | undefined;
      if (
        forcedTraitsForLower &&
        Array.isArray(forcedTraitsForLower) &&
        forcedTraitsForLower.length > 0
      ) {
        if (!forcedTraitsForLower.includes(traitName)) {
          return false;
        }
      }
    }

    const forcedCombosForCurrent = forcedCombinations[layerName]?.[traitName] as
      | Record<string, string[]>
      | undefined;
    if (forcedCombosForCurrent) {
      for (const [forcedLayer, forcedTraits] of Object.entries(forcedCombosForCurrent)) {
        const forcedLayerIndex = orderedLayers.indexOf(forcedLayer);

        if (forcedLayerIndex >= 0 && forcedLayerIndex < currentLayerIndex) {
          const existingTrait = selectedTraits[forcedLayer];

          if (
            existingTrait &&
            Array.isArray(forcedTraits) &&
            !forcedTraits.includes(existingTrait)
          ) {
            return false;
          }
        }
      }
    }

    return true;
  });
