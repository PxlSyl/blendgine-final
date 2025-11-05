import { StateCreator } from 'zustand';
import * as THREE from 'three';

import type { Preview3DState } from '../types';

import { useLayerOrderStore } from '@/components/store/layerOrder/main';
import { useGeneratePreviewStore } from '@/components/store/layerOrder/generatePreviewStore';
import { usePreview3DStore } from '@/components/store/layerOrder/preview3Dstore';

type GenerationSliceState = Pick<
  Preview3DState,
  | 'isGenerating'
  | 'generationId'
  | 'meshes'
  | 'cleanupMesh'
  | 'getCurrentParams'
  | 'setMeshes'
  | 'setIsGenerating'
  | 'setGenerationId'
  | 'createMesh'
  | 'meshCache'
  | 'perspectiveParams'
  | 'orthographicParams'
  | 'updateMeshPositions'
  | 'setLayerThickness'
  | 'cameraType'
>;

export interface GenerationSlice {
  triggerGeneration: () => Promise<void>;
  setIsGenerating: (value: boolean) => void;
}

let generationTimeout: NodeJS.Timeout | undefined;
let isGenerationInProgress = false;

export const createGenerationSlice: StateCreator<GenerationSliceState, [], [], GenerationSlice> = (
  set,
  get
) => ({
  triggerGeneration: async () => {
    const state = get();
    if (state.isGenerating || isGenerationInProgress) {
      return;
    }

    if (generationTimeout) {
      clearTimeout(generationTimeout);
    }

    return new Promise<void>((resolve) => {
      generationTimeout = setTimeout(() => {
        void (async () => {
          try {
            if (isGenerationInProgress) {
              resolve();
              return;
            }
            isGenerationInProgress = true;
            await performGeneration();
            isGenerationInProgress = false;
            resolve();
          } catch (error) {
            console.error('Error in debounced generation:', error);
            isGenerationInProgress = false;
            resolve();
          }
        })();
      }, 100);
    });
  },

  setIsGenerating: (value: boolean) => set({ isGenerating: value }),
});

const performGeneration = async () => {
  const state = usePreview3DStore.getState();
  if (state.isGenerating) {
    return;
  }

  const wasPaused = state.animationState.isPaused;

  usePreview3DStore.setState({
    isGenerating: true,
    generationId: Date.now(),
  });

  try {
    const layerOrderStore = useLayerOrderStore.getState();
    const { activeSetId } = layerOrderStore;
    const currentSetId = activeSetId ?? 'set1';
    const currentParams = state.getCurrentParams();

    const savedParams = {
      spacing: currentParams.layerSpacing,
      thickness: currentParams.layerThickness,
      zoom: currentParams.zoom,
    };

    state.meshes.forEach((mesh) => {
      if (mesh) {
        state.cleanupMesh(mesh);
      }
    });

    usePreview3DStore.setState((state) => ({
      meshes: [],
      meshCache: {
        ...state.meshCache,
        [currentSetId]: [],
      },
    }));

    await useGeneratePreviewStore.getState().generatePreview();

    const orderedLayers = layerOrderStore.getOrderedLayers();
    const { currentTraits } = layerOrderStore;
    const newMeshes: THREE.Mesh[] = [];

    for (let i = 0; i < orderedLayers.length; i++) {
      const layerName = orderedLayers[i];
      const traitName = currentTraits[layerName];
      if (!traitName) {
        continue;
      }

      if (traitName === 'None') {
        continue;
      }

      const layerConfig = layerOrderStore.rarityConfig[layerName];
      if (!layerConfig?.sets?.[currentSetId]?.active) {
        continue;
      }

      const imageData = await useGeneratePreviewStore
        .getState()
        .getLayerImage(layerName, traitName);
      if (!imageData.url) {
        continue;
      }

      const image = {
        element: new Image(),
        layerName,
        traitName,
        opacity: 1,
        blendMode: 'source-over',
      };

      image.element.src = imageData.url;
      await new Promise((resolve) => {
        image.element.onload = resolve;
      });

      const mesh = await state.createMesh({
        image,
        layerName,
        traitName,
        layerSpacing: savedParams.spacing,
        layerThickness: savedParams.thickness,
        meshIndex: i,
      });

      if (mesh) {
        newMeshes.push(mesh);
      }
    }

    usePreview3DStore.setState((state) => ({
      meshes: newMeshes,
      meshCache: {
        ...state.meshCache,
        [currentSetId]: newMeshes,
      },
      perspectiveParams: {
        ...state.perspectiveParams,
        layerSpacing: savedParams.spacing,
        layerThickness: savedParams.thickness,
        zoom: savedParams.zoom,
      },
      orthographicParams: {
        ...state.orthographicParams,
        layerSpacing: savedParams.spacing,
        layerThickness: savedParams.thickness,
        zoom: savedParams.zoom,
      },
      needsUpdate: true,
    }));

    setTimeout(() => {
      const currentState = usePreview3DStore.getState();
      if (currentState.meshes.length > 0) {
        currentState.updateMeshPositions();
        currentState.setLayerThickness(savedParams.thickness, currentState.cameraType);

        if (!wasPaused) {
          currentState.startAnimation();
        }
      }
    }, 100);
  } catch (error) {
    console.error('Error in triggerGeneration:', error);
    usePreview3DStore.setState({ isGenerating: false });
  } finally {
    usePreview3DStore.getState().handleGenerationStateChange(false);
  }
};
