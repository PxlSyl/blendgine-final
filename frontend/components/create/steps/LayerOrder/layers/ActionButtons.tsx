import { memo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { EyeOpenIcon, TrashIcon, RestoreIcon, ExpandIcon, CollapseIcon } from '@/components/icons';
import { ActionButton, ActionButtonProps } from '@/components/shared/ActionButton';

interface ActionButtonsProps {
  isVisible: boolean;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onEnableAll: () => void;
  onDisableAll: () => void;
  onResetForcedTraits: () => void;
}

export const ActionButtons = memo<ActionButtonsProps>(
  ({ isVisible, onExpandAll, onCollapseAll, onEnableAll, onDisableAll, onResetForcedTraits }) => {
    const buttons: ActionButtonProps[] = [
      {
        label: 'Expand All',
        description: 'Expand all layer groups to show their traits',
        onClick: onExpandAll,
        color: 'purple',
        icon: ExpandIcon,
        delay: 0,
      },
      {
        label: 'Collapse All',
        description: 'Collapse all layer groups to hide their traits',
        onClick: onCollapseAll,
        color: 'pink',
        icon: CollapseIcon,
        delay: 0,
      },
      {
        label: 'Enable All',
        description: 'Enable all traits in all layers for generation',
        onClick: onEnableAll,
        color: 'purple',
        icon: RestoreIcon,
        delay: 0,
      },
      {
        label: 'Disable All',
        description: 'Disable all traits in all layers',
        onClick: onDisableAll,
        color: 'pink',
        icon: TrashIcon,
        delay: 0,
      },
      {
        label: 'Reset',
        description: 'Clear all forced trait selections and return to random generation',
        onClick: onResetForcedTraits,
        color: 'blue',
        icon: EyeOpenIcon,
        delay: 0,
      },
    ];

    return (
      <div className="flex flex-wrap gap-2">
        <AnimatePresence>
          {isVisible && buttons.map((button) => <ActionButton key={button.label} {...button} />)}
        </AnimatePresence>
      </div>
    );
  }
);

ActionButtons.displayName = 'ActionButtons';
