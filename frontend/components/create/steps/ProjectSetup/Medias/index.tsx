import React from 'react';

import { BLEND_MODES } from '@/types/blendModes';

import { useProjectSetup } from '@/components/store/projectSetup/hook';
import { capitalize } from '@/utils/functionsUtils';
import { FolderIcon } from '@/components/icons';
import { CanvasImagePreview, type LoadedImage } from './CanvasImagePreview';

import { EmptyState } from './Components';

const Medias: React.FC = React.memo(() => {
  const { layerImages, loadedImages, loadLayerImageNames, selectedFolder } = useProjectSetup();

  React.useEffect(() => {
    if (selectedFolder) {
      void loadLayerImageNames();
    }
  }, [selectedFolder, loadLayerImageNames]);

  const formattedLoadedImages = React.useMemo(() => {
    const formatted: Record<string, LoadedImage> = {};
    Object.entries(loadedImages).forEach(([key, value]) => {
      const mode = value.blend.mode in BLEND_MODES ? value.blend.mode : 'source-over';

      formatted[key] = {
        src: value.src,
        blend: {
          mode,
          opacity: value.blend.opacity,
        },
        dimensions: value.dimensions,
      };
    });
    return formatted;
  }, [loadedImages]);

  const sortedLayers = React.useMemo(
    () =>
      [...layerImages].sort((a, b) =>
        a.layerName.localeCompare(b.layerName, undefined, { sensitivity: 'base' })
      ),
    [layerImages]
  );

  if (!selectedFolder) {
    return <EmptyState />;
  }

  return (
    <div className="relative flex flex-col grow h-full">
      <div className="grow overflow-y-auto">
        {sortedLayers.map((layer, layerIndex) => (
          <div
            key={`layer-${layer.layerName}-${layerIndex}`}
            className="mb-2 sm:mb-4 pb-4 border-b border-gray-400/10 last:border-b-0 last:mb-0 last:pb-0"
          >
            <div className="flex items-center mb-2 sm:mb-4">
              <FolderIcon className="w-4 h-4 sm:w-5 sm:h-5 text-[rgb(var(--color-secondary))] mr-2" />
              <span className="text-sm sm:text-md font-semibold text-gray-700 dark:text-gray-300">
                {capitalize(layer.layerName)} ({layer.imageNames.length} images)
              </span>
            </div>
            <div className="p-4 rounded-sm relative bg-gray-100/80 dark:bg-gray-800/80 bg-[size:20px_20px] bg-[linear-gradient(to_right,#E5E7EB_1px,transparent_1px),linear-gradient(to_bottom,#E5E7EB_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(75,85,99,0.3)_1px,transparent_1px),linear-gradient(to_bottom,rgba(75,85,99,0.3)_1px,transparent_1px)]">
              <div className="flex flex-wrap gap-4">
                {[...layer.imageNames]
                  .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
                  .map((imageName, imageIndex) => (
                    <CanvasImagePreview
                      key={`${layer.layerName}-${imageName}-${imageIndex}`}
                      layerName={layer.layerName}
                      imageName={imageName}
                      loadedImages={formattedLoadedImages}
                    />
                  ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

Medias.displayName = 'Medias';

export default Medias;
