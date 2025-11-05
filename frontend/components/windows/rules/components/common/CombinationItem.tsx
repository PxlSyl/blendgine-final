import React from 'react';
import { motion } from 'framer-motion';

import { capitalize, removeFileExtension } from '@/utils/functionsUtils';

import { LinkIcon, AttentionIcon } from '@/components/icons';
import { TraitPreview } from '@/components/windows/rules/components/common/TraitPreview';
import DeleteButton3D from '@/components/windows/rules/components/common/DeleteButton3D';

type CombinationType = 'forced' | 'incompatible';

interface CombinationItemProps {
  layer1: string;
  trait1: string;
  layer2: string;
  trait2: string;
  onRemove: () => void;
  type: CombinationType;
  projectFolder?: string;
}

export const CombinationItem: React.FC<CombinationItemProps> = ({
  layer1,
  trait1,
  layer2,
  trait2,
  onRemove,
  type,
  projectFolder,
}) => {
  const config = {
    forced: {
      textClass: 'text-[rgb(var(--color-accent))]',
      iconClass: 'text-[rgb(var(--color-accent))]',
      relationshipText: 'forced',
      icon: LinkIcon,
      tooltipText: 'Remove forced combination',
    },
    incompatible: {
      textClass: 'text-[rgb(var(--color-secondary))]',
      iconClass: 'text-[rgb(var(--color-secondary))]',
      relationshipText: 'incompatible',
      icon: AttentionIcon,
      tooltipText: 'Remove incompatibility',
    },
  };

  const { textClass, iconClass, relationshipText, icon: Icon, tooltipText } = config[type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="mb-2 p-2 rounded-sm shadow-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
    >
      <div className="text-sm flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <div>
            {capitalize(removeFileExtension(layer1))} ({capitalize(removeFileExtension(trait1))}) is{' '}
            <span className={`${textClass} font-bold`}>{relationshipText}</span> with{' '}
            {capitalize(removeFileExtension(layer2))} ({capitalize(removeFileExtension(trait2))})
          </div>
          <DeleteButton3D onClick={onRemove} tooltip={tooltipText} />
        </div>

        <div className="flex items-center">
          <div className="flex items-center justify-center space-x-8">
            <TraitPreview layerName={layer1} traitName={trait1} projectFolder={projectFolder} />
            <Icon className={`w-6 h-6 mb-1 animate-pulse ${iconClass}`} />
            <TraitPreview layerName={layer2} traitName={trait2} projectFolder={projectFolder} />
          </div>
        </div>
      </div>
    </motion.div>
  );
};
CombinationItem.displayName = 'CombinationItem';
