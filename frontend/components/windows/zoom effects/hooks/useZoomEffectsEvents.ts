import { useEffect, useState } from 'react';
import { listen } from '@tauri-apps/api/event';
import { convertFileSrc } from '@tauri-apps/api/core';

interface ZoomEffectsPayload {
  file_path: string;
  title: string;
}

export const useZoomEffectsEvents = () => {
  const [imageData, setImageData] = useState<string | null>(null);
  const [convertedImageSrc, setConvertedImageSrc] = useState<string | null>(null);
  const [title, setTitle] = useState<string>('');

  useEffect(() => {
    let cancelled = false;

    const unlistenPromise = listen<ZoomEffectsPayload>('zoom-effects-init', (event) => {
      if (!cancelled && event.payload) {
        setImageData(event.payload.file_path);
        setTitle(event.payload.title);
        const convertedSrc = convertFileSrc(event.payload.file_path);
        setConvertedImageSrc(convertedSrc);
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

  return {
    imageData,
    convertedImageSrc,
    title,
  };
};
