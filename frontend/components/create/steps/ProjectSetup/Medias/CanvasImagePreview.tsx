import React, { useMemo } from 'react';

import { BlendProperties } from '@/types/effect';

import { ZoomIcon } from '@/components/icons';
import { ImageLabel, LoadingState } from './Components';
import { Tooltip } from '@/components/shared/ToolTip';

import { useImagePreview } from '@/components/hooks/useImagePreview';

export interface LoadedImage {
  src: string | null;
  originalSrc?: string | null;
  blend: BlendProperties;
  blendedResult?: string;
  dimensions?: {
    width: number;
    height: number;
  };
}

interface CanvasImagePreviewProps {
  layerName: string;
  imageName: string;
  loadedImages: Record<string, LoadedImage>;
  size?: number;
}

export const CanvasImagePreview: React.FC<CanvasImagePreviewProps> = React.memo(
  ({ layerName, imageName, loadedImages }) => {
    const key = useMemo(() => `${layerName}/${imageName}`, [layerName, imageName]);
    const imageSrc = useMemo(() => loadedImages[key]?.src, [loadedImages, key]);

    const { openDisplay } = useImagePreview({
      layerName,
      imageName,
      loadedImages: { [key]: { src: imageSrc } },
    });

    if (!imageSrc) {
      return <LoadingState imageName={imageName} />;
    }

    const isVideo = /\.(mp4|webm|mov|avi|mkv)$/i.test(imageName);
    const getMimeType = (name: string): string => {
      const ext = name.split('.').pop()?.toLowerCase();
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
      <div className="relative w-32 h-32 group">
        {isVideo ? (
          <video
            key={imageSrc}
            className="w-full h-full object-contain rounded-sm border border-gray-700 dark:border-gray-300"
            autoPlay
            loop
            muted
            playsInline
            style={{
              imageRendering: 'pixelated',
            }}
          >
            <source src={imageSrc} type={getMimeType(imageName)} />
          </video>
        ) : (
          <img
            src={imageSrc}
            alt={imageName}
            className="w-full h-full object-contain rounded-sm border border-gray-700 dark:border-gray-300"
            style={{
              imageRendering: 'pixelated',
            }}
          />
        )}
        <button
          onClick={() => openDisplay()}
          className="absolute top-2 right-2 p-1 rounded-full bg-gray-900/50 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-gray-900/70 cursor-pointer"
        >
          <Tooltip tooltip="Preview image">
            <ZoomIcon className="w-4 h-4" />
          </Tooltip>
        </button>
        <ImageLabel imageName={imageName} />
      </div>
    );
  }
);
CanvasImagePreview.displayName = 'CanvasImagePreview';
