import React from 'react';

import { useLayerOrder } from '@/components/store/layerOrder/hook';
import { capitalize, removeFileExtension } from '@/utils/functionsUtils';
import { FolderIcon } from '@/components/icons';

interface RaritySelectorProps {
  selectedLayer: string | null;
  availableLayers: string[];
  onSelectLayer: (layer: string) => void;
}

interface LayerInfo {
  traitCount: number;
}

const RaritySetSelector: React.FC<RaritySelectorProps> = ({
  selectedLayer,
  availableLayers,
  onSelectLayer,
}) => {
  const { rarityConfig } = useLayerOrder();

  const layerInfos = React.useMemo(() => {
    const infos: Record<string, LayerInfo> = {};

    availableLayers.forEach((layer) => {
      const config = rarityConfig[layer];
      if (!config?.traits) {
        return;
      }

      const enabledTraits = Object.values(config.traits).filter((trait) =>
        Object.keys(trait.sets ?? {}).some((setId) => trait.sets[setId]?.enabled)
      );
      if (enabledTraits.length === 0) {
        return;
      }

      infos[layer] = {
        traitCount: enabledTraits.length,
      };
    });

    return infos;
  }, [rarityConfig, availableLayers]);

  return (
    <div
      className={`w-full h-full p-2 flex flex-col bg-white dark:bg-gray-800 rounded-sm shadow-lg`}
    >
      <div className="text-md font-semibold mb-4 text-[rgb(var(--color-primary))]">Layers</div>
      <div className="space-y-1 overflow-y-auto">
        {Object.entries(layerInfos)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([layerName, info]) => (
            <button
              key={layerName}
              onClick={() => onSelectLayer(layerName)}
              className={`w-full text-sm px-2 py-1 rounded-sm cursor-pointer ${
                selectedLayer === layerName
                  ? 'bg-[rgb(var(--color-primary))] text-white'
                  : `text-[rgb(var(--color-secondary))] bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600`
              }`}
            >
              <div className="flex justify-between items-center">
                <div className="flex flex-row items-center">
                  <FolderIcon
                    className={`w-5 h-5 mr-2  ${
                      selectedLayer === layerName
                        ? 'text-white'
                        : 'text-[rgb(var(--color-primary))]'
                    }`}
                  />
                  <span>{capitalize(removeFileExtension(layerName))}</span>
                </div>
                <span className="text-xs opacity-75">
                  {info.traitCount} {info.traitCount === 1 ? 'item' : 'items'}
                </span>
              </div>
            </button>
          ))}
      </div>
    </div>
  );
};

export default RaritySetSelector;
