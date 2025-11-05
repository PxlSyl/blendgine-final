import React, { useCallback, useRef, useEffect, useMemo } from 'react';
import { useLayerOrder } from '@/components/store/layerOrder/hook';
import { useProjectSetup } from '@/components/store/projectSetup/hook';
import { useKeyboardShortcuts } from '@/components/hooks/useKeyboardShortcuts';

import PreviewCanvas from './PreviewCanvas';
import PreviewButtons from './components/PreviewButtons';

interface PreviewImageProps {
  dimensions?: {
    width: number;
    height: number;
  };
}

const PreviewImage: React.FC<PreviewImageProps> = ({ dimensions }) => {
  const {
    viewMode,
    isGenerating,
    generationId: previewGenerationId,
    triggerGeneration,
    fps,
    setFPS,
    setViewMode,
    getActiveLayers,
  } = useLayerOrder();

  const mountedRef = useRef(true);

  const { selectedFolder, isAnimatedCollection } = useProjectSetup();

  const activeLayers = useMemo(() => {
    return getActiveLayers();
  }, [getActiveLayers]);

  const triggerGenerationRef = useRef(triggerGeneration);
  triggerGenerationRef.current = triggerGeneration;

  const handleRefresh = useCallback(() => {
    if (!isGenerating && selectedFolder) {
      void triggerGenerationRef.current();
    }
  }, [isGenerating, selectedFolder]);

  useKeyboardShortcuts({
    'shift+g': handleRefresh,
  });

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const containerStyle = useMemo(() => {
    if (!dimensions) {
      return {};
    }

    return {
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    };
  }, [dimensions]);

  if (!selectedFolder) {
    return (
      <div className="w-full max-w-[500px] mx-auto p-4 rounded-lg text-center bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
        No folder selected
      </div>
    );
  }

  if (activeLayers.length === 0) {
    return (
      <div className="w-full max-w-[500px] mx-auto p-4 rounded-lg text-center bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
        No active layers selected
      </div>
    );
  }

  return (
    <div className="relative w-full h-full" style={containerStyle}>
      <div className="w-full h-full flex flex-col min-h-0">
        <PreviewButtons
          viewMode={viewMode}
          setViewMode={setViewMode}
          isGenerating={isGenerating}
          handleRefresh={handleRefresh}
          isAnimatedCollection={isAnimatedCollection}
          fps={fps}
          setFPS={setFPS}
        />
        <div className="grow min-h-0 flex flex-col mt-2">
          <PreviewCanvas
            generationId={previewGenerationId}
            layers={activeLayers}
            selectedFolder={selectedFolder}
            viewMode={viewMode}
          />
        </div>
      </div>
    </div>
  );
};

export default React.memo(PreviewImage);
