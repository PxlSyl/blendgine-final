import { memo } from 'react';

import { useProjectSetup } from '@/components/store/projectSetup/hook';
import { useProjectReload } from '../hooks/useProjectReload';

import { FolderItem } from './FolderItem';

const FolderStructure = memo(() => {
  const handleReload = useProjectReload();
  const { layerImages } = useProjectSetup();

  const sortedLayers = [...layerImages].sort((a, b) =>
    a.layerName.localeCompare(b.layerName, undefined, { sensitivity: 'base' })
  );

  return (
    <div>
      {sortedLayers.map((layer, index) => (
        <FolderItem
          key={`${layer.layerName}-${index}`}
          folderName={layer.layerName}
          handleReload={handleReload}
        />
      ))}
    </div>
  );
});

FolderStructure.displayName = 'FolderStructure';

export default FolderStructure;
