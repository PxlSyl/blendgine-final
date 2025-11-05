import React, { useEffect } from 'react';
import { useRulesStore } from '@/components/windows/rules/store/main';
import { CombinationsIcon } from '@/components/icons/StepIcons';
import { Tooltip } from '@/components/shared/ToolTip';
import HeaderButton from '@/components/shared/HeaderButton';

interface LayersOptionsProps {
  possibleCombinations: number;
}

const LayersOptions: React.FC<LayersOptionsProps> = ({ possibleCombinations }) => {
  const { openRulesWindow, isWindowOpen, checkWindowStatus } = useRulesStore();

  useEffect(() => {
    void checkWindowStatus();
  }, [checkWindowStatus]);

  const handleOpenRulesWindow = () => {
    void openRulesWindow();
  };

  return (
    <div className="flex items-center justify-between">
      <Tooltip tooltip="Layer rules">
        <HeaderButton
          onClick={handleOpenRulesWindow}
          icon={<CombinationsIcon className="w-4 h-4" />}
          isActive={isWindowOpen}
        >
          Rules
        </HeaderButton>
      </Tooltip>

      <div className="text-sm font-medium text-gray-600 dark:text-gray-300">
        <span className="text-[rgb(var(--color-primary))]">Possible combinations:</span>{' '}
        <span className="text-[rgb(var(--color-secondary))] font-bold">
          {possibleCombinations.toLocaleString()}
        </span>
      </div>
    </div>
  );
};

export default LayersOptions;
