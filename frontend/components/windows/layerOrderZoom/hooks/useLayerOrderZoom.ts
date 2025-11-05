import { useEffect, useRef, useState, useMemo } from 'react';
import { listen } from '@tauri-apps/api/event';
import { api } from '@/services';

interface Layer {
  id: string;
  name: string;
  image: string;
  order: number;
  visible: boolean;
  isSpritesheet?: boolean;
  frameWidth?: number;
  frameHeight?: number;
  totalFrames?: number;
  spritesheetCols?: number;
  spritesheetRows?: number;
  opacity?: number;
  blendMode?: GlobalCompositeOperation;
}

interface LayerOrderZoomPayload {
  layers: Layer[];
  isAnimatedCollection?: boolean;
  fps?: number;
  maxFrames?: number;
  currentFrame?: number;
}

type ImageCache = { [src: string]: HTMLImageElement };

function buildImageConfigs(layers: Layer[], width: number, height: number) {
  return layers
    .map((layer) => {
      if (layer.isSpritesheet && layer.frameWidth && layer.frameHeight && layer.totalFrames) {
        const frameAspectRatio = layer.frameWidth / layer.frameHeight;
        const canvasAspectRatio = width / height;

        let destWidth: number, destHeight: number;
        if (frameAspectRatio > canvasAspectRatio) {
          destWidth = width * 0.8;
          destHeight = destWidth / frameAspectRatio;
        } else {
          destHeight = height * 0.8;
          destWidth = destHeight * frameAspectRatio;
        }

        return {
          ...layer,
          destWidth,
          destHeight,
        };
      } else {
        return {
          ...layer,
          destWidth: width * 0.8,
          destHeight: height * 0.8,
        };
      }
    })
    .filter((config) => config.visible);
}

export const useLayerOrderZoom = () => {
  const [layers, setLayers] = useState<Layer[]>([]);
  const [isAnimatedCollection, setIsAnimatedCollection] = useState(false);
  const [fps, setFps] = useState(24);
  const [maxFrames, setMaxFrames] = useState(1);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [imagesLoading, setImagesLoading] = useState(false);
  const canvasSize = 500;
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const lastFrameTime = useRef(performance.now());
  const animationRef = useRef<number | undefined>(undefined);
  const imageCache = useRef<ImageCache>({});
  const cleanupRef = useRef<(() => void)[]>([]);

  const imageConfigs = useMemo(() => {
    const configs = buildImageConfigs(layers, canvasSize, canvasSize).filter(
      (c): c is NonNullable<ReturnType<typeof buildImageConfigs>[number]> => c !== null
    );
    return configs;
  }, [layers, canvasSize]);

  useEffect(() => {
    const initTheme = async () => {
      const darkMode = await api.getTheme();
      document.documentElement.classList.toggle('dark', darkMode);
    };
    void initTheme();

    cleanupRef.current.forEach((cleanup) => {
      try {
        cleanup();
      } catch (error) {
        console.warn('Error during cleanup:', error);
      }
    });
    cleanupRef.current = [];

    const setupListeners = async () => {
      try {
        const unlistenInit = await listen(
          'layer-order-zoom-theme-init',
          (event: { payload: boolean }) => {
            const isDarkMode = event.payload;
            document.documentElement.classList.toggle('dark', isDarkMode);
          }
        );

        const unlistenChange = await listen(
          'theme-changed',
          (event: { payload: { darkMode: boolean } }) => {
            const isDarkMode = event.payload.darkMode;
            document.documentElement.classList.toggle('dark', isDarkMode);
          }
        );

        if (typeof unlistenInit === 'function') {
          cleanupRef.current.push(() => {
            try {
              unlistenInit();
            } catch (error) {
              console.warn('Error cleaning up layer-order-zoom-theme-init listener:', error);
            }
          });
        }

        if (typeof unlistenChange === 'function') {
          cleanupRef.current.push(() => {
            try {
              unlistenChange();
            } catch (error) {
              console.warn('Error cleaning up theme-changed listener:', error);
            }
          });
        }
      } catch (error) {
        console.warn('Error setting up theme listeners:', error);
      }
    };

    void setupListeners();

    return () => {
      cleanupRef.current.forEach((cleanup) => {
        try {
          cleanup();
        } catch (error) {
          console.warn('Error during cleanup:', error);
        }
      });
      cleanupRef.current = [];
    };
  }, []);

  useEffect(() => {
    const currentCleanupIndex = cleanupRef.current.length;

    const setupListeners = async () => {
      try {
        const unlisten = await listen<LayerOrderZoomPayload>('layer-order-zoom-init', (event) => {
          if (event.payload) {
            const processedLayers = event.payload.layers.map((layer) => ({
              ...layer,
              opacity: layer.opacity ?? 1,
              blendMode: layer.blendMode ?? 'source-over',
            }));

            setLayers(processedLayers);
            setIsAnimatedCollection(!!event.payload.isAnimatedCollection);
            setFps(event.payload.fps ?? 24);
            setMaxFrames(event.payload.maxFrames ?? 1);
            setCurrentFrame(event.payload.currentFrame ?? 0);
          }
        });

        if (typeof unlisten === 'function') {
          cleanupRef.current.push(() => {
            try {
              unlisten();
            } catch (error) {
              console.warn('Error cleaning up layer-order-zoom-init listener:', error);
            }
          });
        }
      } catch (error) {
        console.warn('Error setting up layer order zoom listeners:', error);
      }
    };

    void setupListeners();

    return () => {
      const functionsToCleanup = cleanupRef.current.splice(currentCleanupIndex);
      functionsToCleanup.forEach((cleanup) => {
        try {
          cleanup();
        } catch (error) {
          console.warn('Error during cleanup:', error);
        }
      });
    };
  }, []);

  useEffect(() => {
    if (!isAnimatedCollection || !isPlaying) {
      return;
    }

    const animate = (timestamp: number) => {
      const frameInterval = 1000 / fps;
      if (timestamp - lastFrameTime.current >= frameInterval) {
        setCurrentFrame((prev) => (prev + 1) % maxFrames);
        lastFrameTime.current = timestamp;
      }
      animationRef.current = requestAnimationFrame(animate);
    };

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isAnimatedCollection, fps, maxFrames, isPlaying]);

  useEffect(() => {
    if (!layers.length) {
      return;
    }

    setImagesLoading(true);
    imageCache.current = {};

    const loadImages = async () => {
      try {
        const imagePromises = layers.map((layer) => {
          if (!layer.image) {
            return Promise.resolve();
          }

          return new Promise<void>((resolve) => {
            const img = new window.Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
              imageCache.current[layer.image] = img;
              resolve();
            };
            img.onerror = () => {
              resolve();
            };
            img.src = layer.image;
          });
        });

        await Promise.all(imagePromises);

        setTimeout(() => {
          setImagesLoading(false);
        }, 50);
      } catch (error) {
        console.error('Error loading images:', error);
        setImagesLoading(false);
      }
    };

    void loadImages();
  }, [layers]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      e.stopPropagation();
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      e.stopPropagation();
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  const handleZoomIn = () => {
    setZoom((prevZoom) => Math.min(9, prevZoom + 0.1));
  };

  const handleZoomOut = () => {
    setZoom((prevZoom) => Math.max(0.5, prevZoom - 0.1));
  };

  const handleResetZoom = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom((prevZoom) => Math.max(0.5, Math.min(9, prevZoom + delta)));
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleNextFrame = () => {
    setCurrentFrame((prev) => (prev + 1) % maxFrames);
  };

  const handlePreviousFrame = () => {
    setCurrentFrame((prev) => (prev - 1 + maxFrames) % maxFrames);
  };

  return {
    layers,
    isAnimatedCollection,
    fps,
    maxFrames,
    currentFrame,
    isPlaying,
    imagesLoading,
    zoom,
    position,
    isDragging,
    imageConfigs,
    imageCache: imageCache.current,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleContextMenu,
    handleZoomIn,
    handleZoomOut,
    handleResetZoom,
    handleWheel,
    handlePlayPause,
    handleNextFrame,
    handlePreviousFrame,
  };
};
