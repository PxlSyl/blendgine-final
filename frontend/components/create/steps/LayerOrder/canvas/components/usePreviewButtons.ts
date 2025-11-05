import { useEffect } from 'react';
import { useLayerOrder } from '@/components/store/layerOrder/hook';
import { useProjectSetup } from '@/components/store/projectSetup/hook';
import { useLayerOrderZoomStore } from '@/components/windows/layerOrderZoom/store';
import { listen, emit } from '@tauri-apps/api/event';
import { calculateTotalFrames } from '../utils/spritesheetUtils';

interface UsePreviewButtonsProps {
  setViewMode: (mode: '2d' | '3d') => void;
  isAnimatedCollection: boolean;
  fps: number;
}

export const usePreviewButtons = ({
  setViewMode,
  isAnimatedCollection,
  fps,
}: UsePreviewButtonsProps) => {
  const {
    getActiveLayers,
    activeSetId,
    rarityConfig,
    images,
    getOrderedLayers,
    framesByLayer,
    maxFrames,
    currentFrame,
    setMaxFrames,
    startAnimation,
    stopAnimation,
    setCurrentFrame,
    animationState,
  } = useLayerOrder();

  const { spritesheetLayout } = useProjectSetup();

  const openLayerOrderZoomWindow = useLayerOrderZoomStore(
    (state) => state.openLayerOrderZoomWindow
  );
  const isWindowOpen = useLayerOrderZoomStore((state) => state.isWindowOpen);
  const checkWindowStatus = useLayerOrderZoomStore((state) => state.checkWindowStatus);

  useEffect(() => {
    if (!spritesheetLayout) {
      setMaxFrames(1);
      return;
    }

    const totalFrames = spritesheetLayout.totalFrames || 1;
    if (totalFrames !== maxFrames) {
      setMaxFrames(totalFrames);
      if (currentFrame >= totalFrames) {
        setCurrentFrame(0);
      }
    }
  }, [spritesheetLayout, maxFrames, currentFrame, setMaxFrames, setCurrentFrame]);

  useEffect(() => {
    void checkWindowStatus();

    let cancelled = false;

    const unlistenPromise = listen('layer-order-zoom-window-closed', () => {
      if (!cancelled) {
        void checkWindowStatus();
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
  }, [checkWindowStatus]);

  useEffect(() => {
    let cancelled = false;

    const unlistenPromise = listen('layer-order-zoom-refresh', () => {
      if (!cancelled) {
        const orderedLayerNames = getOrderedLayers();
        const activeLayersSet = new Set(getActiveLayers());
        const currentSetId = activeSetId ?? 'set1';

        const layers = orderedLayerNames
          .filter((layerName) => activeLayersSet.has(layerName))
          .map((layerName, index) => {
            const layerConfig = rarityConfig[layerName];
            const isActive = layerConfig?.sets?.[currentSetId]?.active ?? false;
            const layerImage = images.find((img) => img.layerName === layerName);
            const traitName = layerImage?.traitName;
            const spritesheets = traitName ? framesByLayer[layerName]?.[traitName] : undefined;
            const firstSpritesheet = spritesheets?.[0];
            const traitConfig = traitName ? layerConfig?.traits?.[traitName] : undefined;
            const blendConfig = traitConfig?.sets?.[currentSetId]?.blend;

            const totalFrames = calculateTotalFrames(spritesheets);

            return {
              id: layerName,
              name: layerName,
              image: layerImage?.element.src ?? '',
              order: index,
              visible: isActive,
              isSpritesheet: !!spritesheets,
              frameWidth: firstSpritesheet?.frameWidth,
              frameHeight: firstSpritesheet?.frameHeight,
              totalFrames,
              spritesheetCols: firstSpritesheet?.layout?.cols,
              spritesheetRows: firstSpritesheet?.layout?.rows,
              opacity: blendConfig?.opacity ?? 1,
              blendMode: blendConfig?.mode ?? 'source-over',
            };
          });

        const maxFrames = Math.max(...layers.map((layer) => layer.totalFrames ?? 1));

        void emit('layer-order-zoom-init', {
          layers,
          isAnimatedCollection,
          fps,
          maxFrames,
          currentFrame: 0,
        });
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
  }, [
    getOrderedLayers,
    getActiveLayers,
    activeSetId,
    rarityConfig,
    images,
    framesByLayer,
    isAnimatedCollection,
    fps,
  ]);

  const handleOpenZoomWindow = () => {
    const orderedLayerNames = getOrderedLayers();
    const activeLayersSet = new Set(getActiveLayers());
    const currentSetId = activeSetId ?? 'set1';

    const layers = orderedLayerNames
      .filter((layerName) => activeLayersSet.has(layerName))
      .map((layerName, index) => {
        const layerConfig = rarityConfig[layerName];
        const isActive = layerConfig?.sets?.[currentSetId]?.active ?? false;
        const layerImage = images.find((img) => img.layerName === layerName);
        const traitName = layerImage?.traitName;
        const spritesheets = traitName ? framesByLayer[layerName]?.[traitName] : undefined;
        const firstSpritesheet = spritesheets?.[0];
        const traitConfig = traitName ? layerConfig?.traits?.[traitName] : undefined;
        const blendConfig = traitConfig?.sets?.[currentSetId]?.blend;

        const totalFrames = calculateTotalFrames(spritesheets);

        return {
          id: layerName,
          name: layerName,
          image: layerImage?.element.src ?? '',
          order: index,
          visible: isActive,
          isSpritesheet: !!spritesheets,
          frameWidth: firstSpritesheet?.frameWidth,
          frameHeight: firstSpritesheet?.frameHeight,
          totalFrames,
          spritesheetCols: firstSpritesheet?.layout?.cols,
          spritesheetRows: firstSpritesheet?.layout?.rows,
          opacity: blendConfig?.opacity ?? 1,
          blendMode: blendConfig?.mode ?? 'source-over',
        };
      });

    const maxFrames = Math.max(...layers.map((layer) => layer.totalFrames ?? 1));

    void openLayerOrderZoomWindow({
      layers,
      isAnimatedCollection,
      fps,
      maxFrames,
      currentFrame: 0,
    });
  };

  const handleViewModeChange = (mode: '2d' | '3d') => {
    setViewMode(mode);
  };

  const handlePlayPause = () => {
    if (animationState.isPaused) {
      startAnimation();
    } else {
      stopAnimation();
    }
  };

  const handleNextFrame = () => {
    const nextFrame = (currentFrame + 1) % maxFrames;
    setCurrentFrame(nextFrame);
  };

  const handlePreviousFrame = () => {
    const prevFrame = (currentFrame - 1 + maxFrames) % maxFrames;
    setCurrentFrame(prevFrame);
  };

  return {
    handleOpenZoomWindow,
    isWindowOpen,
    maxFrames,
    currentFrame,
    startAnimation,
    stopAnimation,
    animationState,
    handleViewModeChange,
    handlePlayPause,
    handleNextFrame,
    handlePreviousFrame,
  };
};
