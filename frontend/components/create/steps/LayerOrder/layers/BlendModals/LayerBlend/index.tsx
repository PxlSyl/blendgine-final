import React from 'react';

import { CheckIcon, MixIcon } from '@/components/icons';
import { formatBlendModeName } from '@/utils/functionsUtils';

import { LayerInfo } from './LayerInfo';
import { OpacityControl } from '../components/OpacityControl';
import { BaseModal } from '@/components/shared/modals';
import { useLayerBlend } from './hook/useLayerBlend';

import { BLEND_MODES, BlendMode } from '@/types/blendModes';

interface LayerBlendModalProps {
  isOpen: boolean;
  onClose: () => void;
  layer: string;
}

const LayerBlendModal: React.FC<LayerBlendModalProps> = ({ isOpen, onClose, layer }) => {
  const {
    currentBlend,
    traitsCount,
    hasMultipleBlends,
    hasChanges,
    handleOpacityChange,
    handleSelectBlendMode,
    handleReset,
    handleCancel,
    handleApply,
  } = useLayerBlend(layer, onClose);

  const modalContent = (
    <BaseModal
      isOpen={isOpen}
      onClose={handleCancel}
      title="Apply blend mode to all traits"
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
        <LayerInfo layer={layer} traitsCount={traitsCount} onReset={handleReset} />
        <OpacityControl
          currentOpacity={currentBlend.opacity}
          onChange={handleOpacityChange}
          text="Global Opacity"
        />

        <div className="flex-1 overflow-y-auto py-3 min-h-0">
          {Object.entries(BLEND_MODES)
            .sort(([nameA], [nameB]) => nameA.localeCompare(nameB))
            .map(([name, value]) => (
              <button
                key={value}
                onClick={() => handleSelectBlendMode(name as BlendMode)}
                className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between cursor-pointer
                    ${
                      !hasMultipleBlends && currentBlend.mode === name
                        ? 'text-[rgb(var(--color-accent))]'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
              >
                <span>{formatBlendModeName(name)}</span>
                {!hasMultipleBlends && currentBlend.mode === name && (
                  <CheckIcon className="w-4 h-4" />
                )}
              </button>
            ))}
        </div>
      </div>
    </BaseModal>
  );

  return modalContent;
};

export default LayerBlendModal;
