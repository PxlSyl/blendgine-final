import React from 'react';
import { AnimatePresence } from 'framer-motion';

import { useRarity } from '@/components/store/rarityStore/hook';
import { useLayerOrder } from '@/components/store/layerOrder/hook';

import { LockClosedIcon, LockOpenIcon, ExpandIcon, CollapseIcon } from '@/components/icons';
import { ActionButton, ActionButtonProps } from '@/components/shared/ActionButton';

export const RarityActionButtons: React.FC<{ isVisible: boolean }> = ({ isVisible }) => {
  const { setLayerExpanded, toggleLock, getOrderedLayers } = useRarity();
  const { rarityConfig, activeSetId } = useLayerOrder();
  const currentSetId = activeSetId ?? 'set1';

  const handleExpandAll = () => {
    const layers = getOrderedLayers();
    layers.forEach((layer) => {
      setLayerExpanded(layer, true);
    });
  };

  const handleCollapseAll = () => {
    const layers = getOrderedLayers();
    layers.forEach((layer) => {
      setLayerExpanded(layer, false);
    });
  };

  const handleLockAll = () => {
    const layers = getOrderedLayers();
    layers.forEach((layer) => {
      if (!rarityConfig[layer]?.sets?.[currentSetId]?.locked) {
        void toggleLock(layer);
      }
    });
  };

  const handleUnlockAll = () => {
    const layers = getOrderedLayers();
    layers.forEach((layer) => {
      if (rarityConfig[layer]?.sets?.[currentSetId]?.locked) {
        void toggleLock(layer);
      }
      Object.entries(rarityConfig[layer]?.traits ?? {}).forEach(([trait, config]) => {
        if (config.sets?.[currentSetId]?.locked) {
          void toggleLock(layer, trait);
        }
      });
    });
  };

  const buttons: ActionButtonProps[] = [
    {
      label: 'Expand All',
      description: 'Expand all rarity sections',
      onClick: handleExpandAll,
      color: 'purple',
      delay: 0,
      icon: ExpandIcon,
    },
    {
      label: 'Collapse All',
      description: 'Collapse all rarity sections',
      onClick: handleCollapseAll,
      color: 'pink',
      delay: 0,
      icon: CollapseIcon,
    },
    {
      label: 'Unlock All',
      description: 'Unlock all rarity values',
      onClick: handleUnlockAll,
      color: 'blue',
      delay: 0,
      icon: LockOpenIcon,
    },
    {
      label: 'Lock All',
      description: 'Lock all rarity values',
      onClick: handleLockAll,
      color: 'red',
      delay: 0,
      icon: LockClosedIcon,
    },
  ];

  if (!isVisible) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      <AnimatePresence>
        {buttons.map((button) => (
          <ActionButton key={button.label} {...button} />
        ))}
      </AnimatePresence>
    </div>
  );
};
