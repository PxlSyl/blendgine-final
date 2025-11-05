import React, { useEffect, useState } from 'react';
import * as Effect from 'effect/Effect';
import { pipe } from 'effect/Function';
import { listen } from '@tauri-apps/api/event';
import { api } from '@/services';

import { useLayersviewStore } from '@/components/windows/layersview/store';

import { FolderIcon, LeftArrowIcon, RightArrowIcon } from '@/components/icons';
import { PictureIcon, VideoIcon } from '@/components/icons/imageIcons';
import Dropdown from '@/components/shared/Dropdown';
import RarityDisplay from '@/components/windows/layersview/RarityDisplay';
import type { LayerData } from '@/components/windows/layersview/services/types';

interface LayersviewContentProps {
  layerData: LayerData | null;
}

const LayersviewContent: React.FC<LayersviewContentProps> = ({ layerData }) => {
  const {
    isLoading,
    layerData: storeLayerData,
    error,
    loadLayerImages,
    nextImage,
    previousImage,
    resetToTarget,
    getAllAvailableLayersAndTraits,
    targetImageLoaded,
  } = useLayersviewStore();

  const [availableLayers, setAvailableLayers] = useState<string[]>([]);
  const [availableTraits, setAvailableTraits] = useState<string[]>([]);
  const [selectedLayer, setSelectedLayer] = useState<string>('');
  const [selectedTrait, setSelectedTrait] = useState<string>('');
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);

  useEffect(() => {
    if (layerData) {
      setSelectedLayer(layerData.layerName);
      setSelectedTrait(layerData.traitName);
    }
  }, [layerData]);

  useEffect(() => {
    const initTheme = async () => {
      try {
        const darkMode = await api.getTheme();
        const colorTheme = await api.getColorTheme();
        document.documentElement.classList.toggle('dark', darkMode);
        document.documentElement.setAttribute('data-theme', colorTheme);
      } catch (error) {
        console.error('Error getting theme:', error);
      }
    };
    void initTheme();

    let cancelled = false;

    const unlistenPromise = listen('layersview-theme-init', (event: { payload: boolean }) => {
      if (!cancelled) {
        const isDark = event.payload;
        document.documentElement.classList.toggle('dark', isDark);
      }
    });

    return () => {
      cancelled = true;
      unlistenPromise
        .then((unlistenFn) => {
          if (!cancelled && typeof unlistenFn === 'function') {
            unlistenFn();
          }
        })
        .catch(() => {
          // Silent fail for race conditions
        });
    };
  }, []);

  useEffect(() => {
    const loadDataEffect = Effect.gen(function* (_) {
      try {
        setIsLoadingData(true);

        const { layers, traitsByLayer } = yield* _(
          Effect.tryPromise(() => getAllAvailableLayersAndTraits())
        );

        setAvailableLayers(layers);

        if (selectedLayer && layers.includes(selectedLayer)) {
          setSelectedLayer(selectedLayer);

          if (traitsByLayer[selectedLayer]) {
            setAvailableTraits(traitsByLayer[selectedLayer]);

            if (selectedTrait && traitsByLayer[selectedLayer].includes(selectedTrait)) {
              setSelectedTrait(selectedTrait);
            } else if (traitsByLayer[selectedLayer].length > 0 && !selectedTrait) {
              setSelectedTrait(traitsByLayer[selectedLayer][0]);
            }
          }
        } else if (layers.length > 0 && !selectedLayer) {
          const [firstLayer] = layers;
          setSelectedLayer(firstLayer);

          if (traitsByLayer[firstLayer]) {
            setAvailableTraits(traitsByLayer[firstLayer]);

            if (traitsByLayer[firstLayer].length > 0) {
              setSelectedTrait(traitsByLayer[firstLayer][0]);
            }
          }
        }

        if (selectedLayer && selectedTrait) {
          yield* _(Effect.tryPromise(() => loadLayerImages(selectedLayer, selectedTrait)));
        }
      } catch (error) {
        console.error('Error while loading data:', error);
      } finally {
        setIsLoadingData(false);
      }
    });

    void Effect.runPromise(
      pipe(
        loadDataEffect,
        Effect.catchAll((error) => {
          console.error('Error in data loading pipeline:', error);
          return Effect.succeed(undefined);
        })
      )
    );
  }, [selectedLayer, selectedTrait, getAllAvailableLayersAndTraits, loadLayerImages]);

  const currentImage = storeLayerData?.images[storeLayerData.currentIndex];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!storeLayerData || storeLayerData.images.length <= 1) {
        return;
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        previousImage();
        const prevIndex =
          (storeLayerData.currentIndex - 1 + storeLayerData.images.length) %
          storeLayerData.images.length;
        setSelectedTrait(storeLayerData.images[prevIndex].name);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        nextImage();
        const nextIndex = (storeLayerData.currentIndex + 1) % storeLayerData.images.length;
        setSelectedTrait(storeLayerData.images[nextIndex].name);
      } else if (e.key === 'Home' && storeLayerData.navigationMode === 'manual') {
        e.preventDefault();
        resetToTarget();
        if (storeLayerData.targetIndex !== undefined) {
          setSelectedTrait(storeLayerData.images[storeLayerData.targetIndex].name);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [storeLayerData, previousImage, nextImage, resetToTarget]);

  return (
    <>
      <header className="mb-2 p-2 border border-gray-200 dark:border-gray-700 flex flex-col gap-1">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 text-sm sm:text-base">
            <div className="flex items-center gap-2">
              <FolderIcon className="w-5 h-5 text-[rgb(var(--color-primary))]" />
              {layerData?.layerName ? `${layerData.layerName} /` : ''}
            </div>
            <div className="flex items-center gap-2 ">
              {currentImage?.name.toLowerCase().endsWith('.png') ? (
                <PictureIcon className="ml-0.5 sm:ml-0w-4 h-4 text-[rgb(var(--color-secondary))]" />
              ) : (
                <VideoIcon className="ml-0.5 sm:ml-0 w-4 h-4 text-[rgb(var(--color-secondary))]" />
              )}
              {currentImage ? currentImage.name : 'Loading...'}
            </div>
          </div>

          {storeLayerData && storeLayerData.images.length > 0 && (
            <div className="text-sm ml-0.5 sm:ml-0 text-gray-500 dark:text-gray-400">
              {storeLayerData.images.length > 1 ? (
                <span className="font-medium">
                  {storeLayerData.currentIndex + 1} / {storeLayerData.images.length}
                </span>
              ) : (
                <span>{storeLayerData.images.length === 1 ? 'Single image' : 'No images'}</span>
              )}
            </div>
          )}
        </div>
        <div className="mt-4 flex">
          <RarityDisplay />
        </div>
      </header>

      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-4">
        <div className="flex-1">
          <label className="block text-xs sm:text-sm font-medium mb-1 text-[rgb(var(--color-primary))]">
            Layer folder
          </label>
          <div className="relative">
            <Dropdown
              options={availableLayers}
              value={selectedLayer}
              placeholder="Select Layer"
              onChange={(layer) => {
                setSelectedLayer(layer);
                void loadLayerImages(layer, selectedTrait);
              }}
              textColorClass="text-gray-500 dark:text-gray-400 text-xs sm:text-sm"
              hoverBgClass="hover:bg-gray-50 dark:hover:bg-gray-600"
              renderOption={(option) => <div className="py-1 px-2">{option}</div>}
              renderValue={(value) => <div className="truncate max-w-[150px]">{value}</div>}
            />
          </div>
        </div>

        <div className="flex-1">
          <label className="block text-xs sm:text-sm font-medium mb-1 text-[rgb(var(--color-secondary))]">
            Trait
          </label>
          <div className="relative">
            <Dropdown
              options={availableTraits}
              value={selectedTrait}
              placeholder="Select Trait"
              onChange={(trait) => {
                setSelectedTrait(trait);
                void loadLayerImages(selectedLayer, trait);
              }}
              textColorClass="text-gray-500 dark:text-gray-400 text-xs sm:text-sm"
              hoverBgClass="hover:bg-gray-50 dark:hover:bg-gray-600"
              renderOption={(option) => <div className="py-1 px-2">{option}</div>}
              renderValue={(value) => <div className="truncate max-w-[150px]">{value}</div>}
              selectedColor="pink"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <div className="font-bold">Error:</div>
          <div>{error}</div>
        </div>
      )}

      {(isLoading || isLoadingData) && (
        <div className="relative w-full h-[calc(100vh-340px)] flex items-center justify-center mt-2">
          <div className="absolute inset-0 bg-size-[20px_20px] bg-[linear-gradient(to_right,#E5E7EB_1px,transparent_1px),linear-gradient(to_bottom,#E5E7EB_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#374151_1px,transparent_1px),linear-gradient(to_bottom,#374151_1px,transparent_1px)]" />
          <div className="relative z-10 w-full h-full flex items-center justify-center bg-gray-100/80 dark:bg-gray-800/80">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[rgb(var(--color-primary))]" />
          </div>
        </div>
      )}

      {!isLoading && !isLoadingData && targetImageLoaded && storeLayerData && (
        <div>
          <>
            <div className="relative w-full h-[calc(100vh-340px)] flex items-center justify-center mt-2">
              <div className="absolute inset-0 bg-size-[20px_20px] bg-[linear-gradient(to_right,#E5E7EB_1px,transparent_1px),linear-gradient(to_bottom,#E5E7EB_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#374151_1px,transparent_1px),linear-gradient(to_bottom,#374151_1px,transparent_1px)]" />

              <div className="relative z-10 w-full h-full flex items-center justify-center bg-gray-100/80 dark:bg-gray-800/80">
                <div className="absolute inset-y-0 left-0 flex items-center z-20">
                  {storeLayerData.images.length > 1 && (
                    <button
                      onClick={previousImage}
                      className="h-full px-2 group hover:bg-gray-200/50 dark:hover:bg-gray-700/50 rounded-l-lg transition-colors duration-200 focus:outline-none cursor-pointer"
                      title="Previous image"
                    >
                      <LeftArrowIcon className="w-8 h-8 text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors duration-200" />
                    </button>
                  )}
                </div>

                {currentImage ? (
                  <img
                    src={currentImage.url}
                    alt={currentImage.name}
                    className="w-full h-full object-contain rounded-lg"
                    loading="eager"
                    style={{
                      imageRendering: 'pixelated',
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center w-full h-full text-gray-400 dark:text-gray-600">
                    No image to display
                  </div>
                )}

                <div className="absolute inset-y-0 right-0 flex items-center z-20">
                  {storeLayerData.images.length > 1 && (
                    <button
                      onClick={nextImage}
                      className="h-full px-2 group hover:bg-gray-200/50 dark:hover:bg-gray-700/50 rounded-r-lg transition-colors duration-200 focus:outline-none cursor-pointer"
                      title="Next image"
                    >
                      <RightArrowIcon className="w-8 h-8 text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors duration-200" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </>
        </div>
      )}
    </>
  );
};

export default LayersviewContent;
