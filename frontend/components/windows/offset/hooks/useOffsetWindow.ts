import { useState, useEffect, useCallback } from 'react';
import { listen, emit } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';

interface OffsetData {
  layer: string;
  traitName: string;
  offsetX: number;
  offsetY: number;
  imageUrl: string;
}

export const useOffsetWindow = () => {
  const [layer, setLayer] = useState<string>('');
  const [trait, setTrait] = useState<string>('');
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [imageUrl, setImageUrl] = useState<string>('');

  useEffect(() => {
    let cancelled = false;

    const loadInitialData = async () => {
      try {
        const data = await invoke<OffsetData>('get_offset_data');
        if (!cancelled) {
          setLayer(data.layer);
          setTrait(data.traitName);
          setOffsetX(data.offsetX);
          setOffsetY(data.offsetY);
          setImageUrl(data.imageUrl);
        }
      } catch {
        // Data not available yet, will be received via event
      }
    };
    void loadInitialData();

    const unlistenDataPromise = listen<OffsetData>('offset-update-data', (event) => {
      if (!cancelled) {
        const data = event.payload;
        setLayer(data.layer);
        setTrait(data.traitName);
        setOffsetX(data.offsetX);
        setOffsetY(data.offsetY);
        setImageUrl(data.imageUrl);
      }
    });

    const unlistenThemePromise = listen<boolean>('offset-theme-init', (event) => {
      if (!cancelled) {
        document.documentElement.classList.toggle('dark', event.payload);
      }
    });

    return () => {
      cancelled = true;
      Promise.all([unlistenDataPromise, unlistenThemePromise])
        .then(([unlistenData, unlistenTheme]) => {
          if (!cancelled) {
            unlistenData();
            unlistenTheme();
          }
        })
        .catch(() => {
          // Silent fail
        });
    };
  }, []);

  const handleOffsetXChange = useCallback(
    (value: number) => {
      setOffsetX(value);
      void emit('offset-changed', {
        layer,
        trait,
        offsetX: value,
        offsetY,
      });
    },
    [layer, trait, offsetY]
  );

  const handleOffsetYChange = useCallback(
    (value: number) => {
      setOffsetY(value);
      void emit('offset-changed', {
        layer,
        trait,
        offsetX,
        offsetY: value,
      });
    },
    [layer, trait, offsetX]
  );

  const handleReset = useCallback(() => {
    setOffsetX(0);
    setOffsetY(0);
    void emit('offset-changed', {
      layer,
      trait,
      offsetX: 0,
      offsetY: 0,
    });
  }, [layer, trait]);

  return {
    layer,
    trait,
    offsetX,
    offsetY,
    imageUrl,
    handleOffsetXChange,
    handleOffsetYChange,
    handleReset,
  };
};
