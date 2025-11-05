import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import * as THREE from 'three';

import Preview3D from '../Preview3D';
import LayerControls from '../Preview3D/LayerControls';
import { StaticCanvas } from './static/StaticCanvas';
import { AnimatedCanvasWrapper } from './animated/AnimatedCanvasWrapper';

import { useLayerOrder } from '@/components/store/layerOrder/hook';
import { useLayerPreviewStore } from '@/components/store/projectSetup/layerPreviewStore';
import { useProjectSetup } from '@/components/store/projectSetup/hook';

import { useImageSorting } from '../hooks/useImagesSorting';

import type { PreviewImage } from '@/types/preview';

interface PreviewCanvasProps {
  layers: string[];
  selectedFolder: string;
  generationId: number;
  viewMode: '2d' | '3d';
}

const PreviewCanvas: React.FC<PreviewCanvasProps> = ({
  layers,
  selectedFolder,
  generationId,
  viewMode,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    rarityConfig,
    activeSetId,
    getAllActiveLayers,
    sets,
    images,
    loadImages,
    isGenerating,
    cameraType,
    setCameraType,
    loadAnimatedImages,
  } = useLayerOrder();

  const { loadedImages } = useLayerPreviewStore();
  const currentSetId = activeSetId ?? 'set1';
  const { isAnimatedCollection } = useProjectSetup();
  const perspectiveCameraRef = useRef<THREE.PerspectiveCamera>(null);
  const orthographicCameraRef = useRef<THREE.OrthographicCamera>(null);

  const activeLayers = useMemo(() => getAllActiveLayers(), [getAllActiveLayers]);

  const handleEqualZIndex = useCallback(
    (a: PreviewImage, b: PreviewImage, orderedLayers: string[]) => {
      return orderedLayers.indexOf(a.layerName) - orderedLayers.indexOf(b.layerName);
    },
    []
  );

  const sortedImages = useImageSorting({
    images,
    isGenerating,
    sets,
    currentSetId,
    rarityConfig,
    handleEqualZIndex,
  });

  const allImagesLoaded = useMemo(() => {
    if (isAnimatedCollection) {
      return true;
    }
    return layers.every((layer) => {
      const layerImages = Object.keys(loadedImages).filter((key) => key.startsWith(`${layer}/`));
      return layerImages.length > 0;
    });
  }, [isAnimatedCollection, layers, loadedImages]);

  useEffect(() => {
    const timestamp = Date.now();

    const loadImagesWhenReady = () => {
      if (isAnimatedCollection) {
        void loadImages(selectedFolder, layers, timestamp);
        sortedImages.forEach((img) => {
          void loadAnimatedImages(img.layerName, img.traitName);
        });
      } else if (allImagesLoaded) {
        void loadImages(selectedFolder, layers, timestamp);
      }
    };

    void loadImagesWhenReady();
  }, [
    selectedFolder,
    layers,
    generationId,
    loadImages,
    loadAnimatedImages,
    rarityConfig,
    currentSetId,
    isAnimatedCollection,
    sortedImages,
    allImagesLoaded,
  ]);

  const containerSize = useMemo(() => {
    const minSize = 300;
    const maxSize = 600;
    const screenWidth = window.innerWidth;

    const baseSize = Math.min(maxSize, Math.max(minSize, screenWidth * 0.4));

    if (screenWidth < 640) {
      return Math.min(maxSize, Math.max(minSize, screenWidth * 0.6));
    }

    return baseSize;
  }, []);

  const padding = 20;
  const maxSize = containerSize - padding;

  const handleCameraSwitch = useCallback(() => {
    const currentCamera =
      cameraType === 'perspective' ? perspectiveCameraRef.current : orthographicCameraRef.current;

    if (currentCamera) {
      const currentState = {
        position: currentCamera.position.clone(),
        rotation: currentCamera.rotation.clone(),
        zoom: currentCamera instanceof THREE.OrthographicCamera ? currentCamera.zoom : 1,
      };

      const zoomAdjustment = cameraType === 'perspective' ? 100 : 1 / 100;
      setCameraType(cameraType === 'perspective' ? 'orthographic' : 'perspective');

      requestAnimationFrame(() => {
        const newCamera =
          cameraType === 'perspective'
            ? orthographicCameraRef.current
            : perspectiveCameraRef.current;

        if (newCamera) {
          newCamera.position.copy(currentState.position);
          newCamera.rotation.copy(currentState.rotation);
          if (newCamera instanceof THREE.OrthographicCamera) {
            newCamera.zoom = currentState.zoom * zoomAdjustment;
          }
          newCamera.updateProjectionMatrix();
        }
      });
    }
  }, [cameraType, setCameraType]);

  return (
    <div className="flex flex-col gap-2 h-full">
      <div className="grow p-2 rounded-sm shadow-lg overflow-visible dark:bg-gray-800/50 dark:border-gray-700/50 bg-white/50 backdrop-blur-sm border border-[rgb(var(--color-primary)/0.2)]">
        <div className="flex flex-col h-full min-h-0">
          {viewMode === '3d' ? (
            <div className="flex flex-col h-full">
              <div className="grow">
                <div className="max-h-[calc(100vh-100px)] aspect-square mx-auto xs:max-h-[60vh]">
                  <div
                    ref={containerRef}
                    className="w-full h-full rounded-lg overflow-hidden dark:bg-gray-800 bg-gray-100 flex items-stretch relative cursor-crosshair"
                  >
                    <div className="absolute inset-0 bg-[size:20px_20px] bg-[linear-gradient(to_right,#E5E7EB_1px,transparent_1px),linear-gradient(to_bottom,#E5E7EB_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#374151_1px,transparent_1px),linear-gradient(to_bottom,#374151_1px,transparent_1px)]" />

                    {!isGenerating && (
                      <div className="w-full h-full">
                        <Preview3D
                          layers={activeLayers}
                          currentTraits={Object.fromEntries(
                            sortedImages.map((img) => [img.layerName, img.traitName])
                          )}
                          perspectiveCameraRef={perspectiveCameraRef}
                          orthographicCameraRef={orthographicCameraRef}
                        />
                      </div>
                    )}

                    {isGenerating && (
                      <div className="absolute inset-0 flex items-center justify-center z-[100]">
                        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[rgb(var(--color-primary))]" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-2 bg-inherit z-10">
                <LayerControls onCameraSwitch={handleCameraSwitch} disabled={isGenerating} />
              </div>
            </div>
          ) : (
            <div className="grow">
              <div className="h-[calc(100vh-100px)] aspect-square mx-auto xs:max-h-[60vh]">
                <div
                  ref={containerRef}
                  className="w-full h-full rounded-lg overflow-hidden dark:bg-gray-800 bg-gray-100 flex items-stretch relative cursor-crosshair"
                >
                  <div className="absolute inset-0 bg-[size:20px_20px] bg-[linear-gradient(to_right,#E5E7EB_1px,transparent_1px),linear-gradient(to_bottom,#E5E7EB_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#374151_1px,transparent_1px),linear-gradient(to_bottom,#374151_1px,transparent_1px)]" />

                  {!isGenerating && (
                    <div className="w-full h-full">
                      {isAnimatedCollection ? (
                        <AnimatedCanvasWrapper
                          sortedImages={sortedImages}
                          rarityConfig={rarityConfig}
                          currentSetId={currentSetId}
                          isAnimatedCollection={isAnimatedCollection}
                          maxSize={maxSize}
                        />
                      ) : (
                        <StaticCanvas
                          sortedImages={sortedImages}
                          rarityConfig={rarityConfig}
                          currentSetId={currentSetId}
                          isAnimatedCollection={isAnimatedCollection}
                          maxSize={maxSize}
                        />
                      )}
                    </div>
                  )}

                  {isGenerating && (
                    <div className="absolute inset-0 flex items-center justify-center z-[100]">
                      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[rgb(var(--color-primary))]" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PreviewCanvas;
