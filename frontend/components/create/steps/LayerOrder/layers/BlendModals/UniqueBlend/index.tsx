import React from 'react';

import { BLEND_MODES } from '@/types/blendModes';

import { formatBlendModeName } from '@/utils/functionsUtils';
import { CheckIcon, MixIcon } from '@/components/icons';
import { OpacityControl } from '../components/OpacityControl';
import { TraitInfo } from './TraitInfo';
import { BaseModal } from '@/components/shared/modals';
import { useUniqueBlend } from './hook/useUniqueBlend';

interface BlendModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  layer: string;
  traitName: string;
}

const BlendModeModal: React.FC<BlendModeModalProps> = ({ isOpen, onClose, layer, traitName }) => {
  const {
    currentBlend,
    hasChanges,
    handleOpacityChange,
    handleSelectBlendMode,
    handleReset,
    handleCancel,
    handleApply,
  } = useUniqueBlend(layer, traitName, onClose);

  const modalContent = (
    <BaseModal
      isOpen={isOpen}
      onClose={handleCancel}
      title="Select blend mode and opacity"
      icon={<MixIcon className="w-5 h-5" />}
      width="w-[500px]"
      height="h-[550px]"
      footerProps={{
        onConfirm: () => void handleApply(),
        confirmText: 'Apply',
        closeText: 'Close',
        confirmDisabled: !hasChanges,
      }}
    >
      <div className="w-full flex flex-col h-full">
        <TraitInfo
          layer={layer}
          traitName={traitName}
          currentBlendMode={currentBlend.mode}
          onReset={handleReset}
        />
        <OpacityControl
          currentOpacity={currentBlend.opacity}
          onChange={handleOpacityChange}
          text="Opacity"
        />

        <div className="flex-1 overflow-y-auto py-3 min-h-0">
          {Object.entries(BLEND_MODES)
            .sort(([nameA], [nameB]) => nameA.localeCompare(nameB))
            .map(([name, value]) => (
              <button
                key={value}
                onClick={() => handleSelectBlendMode(value)}
                className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between cursor-pointer
                        ${
                          currentBlend.mode === value
                            ? 'text-[rgb(var(--color-accent))]'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        } transition-colors duration-200`}
              >
                <span>{formatBlendModeName(name)}</span>
                {currentBlend.mode === value && <CheckIcon className="w-4 h-4" />}
              </button>
            ))}
        </div>
      </div>
    </BaseModal>
  );

  return modalContent;
};

export default BlendModeModal;
