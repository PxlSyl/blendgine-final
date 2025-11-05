import { useEffect, useState } from 'react';
import { convertFileSrc } from '@tauri-apps/api/core';

interface UseCanvasImageLoaderProps {
  previewImage: string | null;
  originalImage: string | null;
}

interface ImageState {
  isLoaded: boolean;
  mimeType: string;
  width: number;
  height: number;
  aspectRatio: number;
}

export const useCanvasImageLoader = ({
  previewImage,
  originalImage,
}: UseCanvasImageLoaderProps) => {
  const [previewState, setPreviewState] = useState<ImageState>({
    isLoaded: false,
    mimeType: '',
    width: 0,
    height: 0,
    aspectRatio: 1,
  });

  const [originalState, setOriginalState] = useState<ImageState>({
    isLoaded: false,
    mimeType: '',
    width: 0,
    height: 0,
    aspectRatio: 1,
  });

  const loadImage = async (src: string): Promise<ImageState> => {
    try {
      const response = await fetch(src);
      const blob = await response.blob();
      const mimeType = blob.type;

      if (mimeType.startsWith('video/')) {
        return new Promise((resolve) => {
          const video = document.createElement('video');
          video.muted = true;
          video.loop = true;
          video.autoplay = true;

          video.onloadeddata = () => {
            const width = video.videoWidth;
            const height = video.videoHeight;
            const aspectRatio = width / height;

            resolve({
              isLoaded: true,
              mimeType,
              width,
              height,
              aspectRatio,
            });
          };

          video.onerror = () => {
            resolve({
              isLoaded: false,
              mimeType,
              width: 0,
              height: 0,
              aspectRatio: 1,
            });
          };

          video.src = src;
        });
      } else {
        return new Promise((resolve) => {
          const img = new Image();

          img.onload = () => {
            const { width, height } = img;
            const aspectRatio = width / height;

            resolve({
              isLoaded: true,
              mimeType,
              width,
              height,
              aspectRatio,
            });
          };

          img.onerror = () => {
            resolve({
              isLoaded: false,
              mimeType,
              width: 0,
              height: 0,
              aspectRatio: 1,
            });
          };

          img.src = src;
        });
      }
    } catch (error) {
      console.error('Error loading image:', error);
      return {
        isLoaded: false,
        mimeType: '',
        width: 0,
        height: 0,
        aspectRatio: 1,
      };
    }
  };

  useEffect(() => {
    if (previewImage) {
      setPreviewState((prev) => ({ ...prev, isLoaded: false }));

      loadImage(convertFileSrc(previewImage))
        .then((state) => {
          setPreviewState(state);
        })
        .catch((error) => {
          console.error('Error loading preview image:', error);
        });
    }
  }, [previewImage]);

  useEffect(() => {
    if (originalImage) {
      setOriginalState((prev) => ({ ...prev, isLoaded: false }));

      loadImage(convertFileSrc(originalImage))
        .then((state) => {
          setOriginalState(state);
        })
        .catch((error) => {
          console.error('Error loading original image:', error);
        });
    }
  }, [originalImage]);

  useEffect(() => {
    if (!previewImage) {
      setPreviewState({
        isLoaded: false,
        mimeType: '',
        width: 0,
        height: 0,
        aspectRatio: 1,
      });
    }
  }, [previewImage]);

  useEffect(() => {
    if (!originalImage) {
      setOriginalState({
        isLoaded: false,
        mimeType: '',
        width: 0,
        height: 0,
        aspectRatio: 1,
      });
    }
  }, [originalImage]);

  return {
    previewState,
    originalState,
    isBothLoaded: previewState.isLoaded && originalState.isLoaded,
  };
};
