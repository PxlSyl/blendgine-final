import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useProjectSetup } from '@/components/store/projectSetup/hook';
import { useLayersviewStore } from '@/components/windows/layersview/store';

interface ImagePreviewState {
  layerName: string;
  imageName: string;
}

interface UseImagePreviewProps {
  layerName?: string;
  imageName?: string;
  loadedImages?: Record<string, { src: string | null }>;
  initialIndex?: number;
}

export const useImagePreview = ({
  layerName,
  imageName,
  loadedImages = {},
  initialIndex,
}: UseImagePreviewProps = {}) => {
  const { isOpen, openLayersWindow, closeWindow } = useLayersviewStore();
  const { layerImages } = useProjectSetup();
  const previousLayerImagesRef = useRef(layerImages);

  const allImages = useMemo(() => {
    if (previousLayerImagesRef.current === layerImages) {
      return previousLayerImagesRef.current.reduce((acc, layer) => {
        const sortedImages = [...layer.imageNames].sort();
        return [
          ...acc,
          ...sortedImages.map((name) => ({
            layerName: layer.layerName,
            imageName: name,
          })),
        ];
      }, [] as Array<ImagePreviewState>);
    }
    previousLayerImagesRef.current = layerImages;
    return layerImages.reduce((acc, layer) => {
      const sortedImages = [...layer.imageNames].sort();
      return [
        ...acc,
        ...sortedImages.map((name) => ({
          layerName: layer.layerName,
          imageName: name,
        })),
      ];
    }, [] as Array<ImagePreviewState>);
  }, [layerImages]);

  const initialImage = useMemo(() => {
    if (layerName && imageName) {
      return {
        layerName,
        imageName,
      };
    }

    if (initialIndex !== undefined && initialIndex >= 0 && initialIndex < allImages.length) {
      return allImages[initialIndex];
    }

    return allImages.length > 0 ? allImages[0] : { layerName: '', imageName: '' };
  }, [layerName, imageName, initialIndex, allImages]);

  const [currentImage, setCurrentImage] = useState<ImagePreviewState>(initialImage);
  const previousInitialImageRef = useRef(initialImage);

  useEffect(() => {
    if (previousInitialImageRef.current !== initialImage) {
      setCurrentImage(initialImage);
      previousInitialImageRef.current = initialImage;
    }
  }, [initialImage]);

  const currentGlobalIndex = useMemo(() => {
    return allImages.findIndex(
      (img) => img.layerName === currentImage.layerName && img.imageName === currentImage.imageName
    );
  }, [allImages, currentImage]);

  const initialImageIndex = useMemo(() => {
    if (initialIndex !== undefined && initialIndex >= 0 && initialIndex < allImages.length) {
      return initialIndex;
    }

    if (layerName && imageName) {
      const index = allImages.findIndex(
        (img) => img.layerName === layerName && img.imageName === imageName
      );
      return index >= 0 ? index : 0;
    }

    return currentGlobalIndex >= 0 ? currentGlobalIndex : 0;
  }, [allImages, initialIndex, layerName, imageName, currentGlobalIndex]);

  const handleLayerChange = useCallback(
    (layer: string, trait?: string) => {
      const newImage = allImages.find(
        (img) => img.layerName === layer && (!trait || img.imageName === trait)
      );
      if (newImage) {
        setCurrentImage(newImage);
      }
    },
    [allImages]
  );

  const openDisplay = useCallback(() => {
    void openLayersWindow(currentImage.layerName, currentImage.imageName);
  }, [openLayersWindow, currentImage]);

  const handleCloseDisplay = useCallback(() => {
    void closeWindow();
  }, [closeWindow]);

  return {
    isOpen,
    closeDisplay: handleCloseDisplay,
    openDisplay,
    currentImage,
    allImages,
    initialImageIndex,
    handleLayerChange,
    loadedImages,
  };
};
