import React, { useCallback, useEffect, useState } from 'react';
import { type GridFile } from '../hooks/generate/useFileWatcher';
import { useGenerateStore } from '@/components/store/generate';

export const GeneratedImagesGrid: React.FC<{ file?: GridFile }> = ({ file }) => {
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVideo, setIsVideo] = useState(false);
  const { isCancelling } = useGenerateStore();

  const loadMedia = useCallback(() => {
    if (!file) {
      setIsLoading(false);
      return;
    }

    if (!file.url) {
      setIsLoading(false);
      return;
    }

    const isVideoFormat = /\.(mp4|webm)$/i.test(file.url);
    setIsVideo(isVideoFormat);
    setMediaUrl(file.url);
    setIsLoading(false);
  }, [file]);

  useEffect(() => {
    void loadMedia();
  }, [loadMedia]);

  if (isLoading) {
    return (
      <div className="relative w-32 h-32 group">
        <div className="w-full h-full bg-gray-100 dark:bg-gray-800 rounded-sm border border-gray-700 dark:border-gray-300 flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[rgb(var(--color-primary))]" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 h-full w-full flex items-center justify-center">
      {!isCancelling && mediaUrl ? (
        isVideo ? (
          <video
            src={mediaUrl || ''}
            autoPlay
            controls
            loop
            muted
            playsInline
            width={500}
            height={500}
            className="max-w-full max-h-full object-contain rounded-sm shadow-lg border border-gray-200 dark:border-gray-700"
          />
        ) : (
          <img
            src={mediaUrl || ''}
            alt="Generated"
            width={500}
            height={500}
            style={{ imageRendering: 'pixelated' }}
            className="max-w-full max-h-full object-contain rounded-sm shadow-lg border border-gray-200 dark:border-gray-700"
          />
        )
      ) : (
        <div className="text-center text-gray-500 dark:text-gray-400">
          {mediaUrl === undefined ||
            isLoading ||
            (isCancelling && (
              <div className="flex flex-col items-center space-y-2">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[rgb(var(--color-primary))]" />
              </div>
            ))}
        </div>
      )}
    </div>
  );
};
