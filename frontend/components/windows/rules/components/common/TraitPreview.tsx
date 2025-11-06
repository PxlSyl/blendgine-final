import React, { useEffect, useState, useCallback } from 'react';
import { Effect } from 'effect';

import { api } from '@/services';
import { convertFileSrc } from '@tauri-apps/api/core';

export const TraitPreview: React.FC<{
  layerName: string;
  traitName: string;
  projectFolder?: string;
}> = React.memo(({ layerName, traitName, projectFolder }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [imageData, setImageData] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const loadImage = useCallback(async () => {
    if (!projectFolder) {
      console.warn('TraitPreview: No project folder provided');
      setError('No project folder provided');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const supportedExtensions = ['png', 'webp', 'gif', 'mp4', 'webm', 'mov', 'avi', 'mkv'];
    const possibleImageNames = supportedExtensions.map((ext) => `${traitName}.${ext}`);

    let imagePath: string | null = null;

    for (const imageName of possibleImageNames) {
      try {
        const path = await Effect.runPromise(
          Effect.tryPromise({
            try: () => api.getLayerImagePath(projectFolder, layerName, imageName),
            catch: (error) =>
              new Error(`Failed to get image path for ${imageName}: ${String(error)}`),
          })
        );

        if (path) {
          imagePath = path;
          break;
        }
      } catch {
        continue;
      }
    }

    if (!imagePath) {
      console.warn(
        `TraitPreview: No image found for ${layerName}/${traitName} with any supported extension`
      );
      setError(`No image found for ${traitName}`);
      setImageData(null);
    } else {
      const imageSrc = convertFileSrc(imagePath);
      setImageData(imageSrc);
    }

    setIsLoading(false);
  }, [projectFolder, traitName, layerName]);

  useEffect(() => {
    void loadImage();

    const checkAndRetry = setTimeout(() => {
      if (!imageData && retryCount < 5 && !error) {
        setRetryCount((prev) => prev + 1);
        void loadImage();
      }
    }, 500);

    return () => clearTimeout(checkAndRetry);
  }, [layerName, traitName, projectFolder, retryCount, error, imageData, loadImage]);

  const isVideo = React.useMemo(() => {
    if (!imageData) {
      return false;
    }
    return /\.(mp4|webm|mov|avi|mkv)$/i.test(imageData);
  }, [imageData]);

  const getMimeType = (url: string): string => {
    const ext = url.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'mp4':
        return 'video/mp4';
      case 'webm':
        return 'video/webm';
      case 'mov':
        return 'video/quicktime';
      case 'avi':
        return 'video/x-msvideo';
      case 'mkv':
        return 'video/x-matroska';
      default:
        return 'video/mp4';
    }
  };

  return (
    <div className="relative rounded-sm overflow-hidden bg-gray-200 dark:bg-gray-600 w-24 h-24 flex items-center justify-center trait-preview">
      {imageData ? (
        isVideo ? (
          <video
            key={imageData}
            className="object-contain w-full h-full p-2"
            autoPlay
            loop
            muted
            playsInline
            onError={() => {
              console.error(`TraitPreview: Error displaying video for ${layerName}/${traitName}`);
              setError(`Error displaying video`);
            }}
          >
            <source src={imageData} type={getMimeType(imageData)} />
            Your browser does not support video playback.
          </video>
        ) : (
          <img
            src={imageData}
            alt={`${traitName} preview`}
            className="object-contain w-full h-full p-2"
            onError={() => {
              console.error(`TraitPreview: Error displaying image for ${layerName}/${traitName}`);
              setError(`Error displaying image`);
            }}
          />
        )
      ) : (
        <div className="animate-pulse w-full h-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center text-xs text-gray-500">
          {isLoading
            ? 'Loading...'
            : error === 'No project folder provided'
              ? 'No project'
              : (error ?? 'Image not found')}
        </div>
      )}
    </div>
  );
});

TraitPreview.displayName = 'TraitPreview';
