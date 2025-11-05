import React from 'react';

import type { FooterActionsProps } from './types';

import { RefreshIcon } from '@/components/icons';
import { EffectsIcon, LegendaryIcon } from '@/components/icons/StepIcons';

const BUTTON_CONFIGS = {
  filter: {
    onClick: 'handleApplyFilters',
    icon: EffectsIcon,
    text: 'Apply To Collection',
  },
  generation: {
    onClick: 'handleGenerate',
    icon: RefreshIcon,
    text: 'Generate Collection',
  },
  legendary: {
    onClick: 'onMixLegendaries',
    icon: LegendaryIcon,
    text: 'Mix Legendaries With Collection',
  },
} as const;

interface GenerateButtonProps {
  type: 'filter' | 'generation' | 'legendary' | undefined;
  disabled: boolean;
  handlers: FooterActionsProps['handlers'];
  isProcessing: boolean;
}

export const GenerateButton = React.memo<GenerateButtonProps>(
  ({ type, disabled, handlers, isProcessing }) => {
    if (!type) {
      return null;
    }

    const config = BUTTON_CONFIGS[type];
    const Icon = config.icon;

    return (
      <button
        onClick={() => void handlers[config.onClick]()}
        disabled={disabled}
        className={`w-full bg-gradient-to-r from-[rgb(var(--color-primary-light))] to-[rgb(var(--color-secondary))] hover:from-[rgb(var(--color-primary))] hover:to-[rgb(var(--color-secondary-dark))] text-white font-bold py-3 px-6 rounded-md transition duration-300 ease-in-out disabled:opacity-75 flex items-center justify-center ${isProcessing ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        style={{
          boxShadow:
            'inset 0 1px 0 0 rgba(255,255,255,0.4), inset 0 -2px 2px rgba(0,0,0,0.2), inset -2px 0 2px rgba(0,0,0,0.2), 0 1px 3px rgba(0,0,0,0.2)',
          border: '1px solid rgb(var(--color-primary))',
          textShadow: '0 -1px 0 rgba(0,0,0,0.2)',
        }}
      >
        <Icon className="mr-2 h-8 w-8" />
        <span>{config.text}</span>
      </button>
    );
  }
);

GenerateButton.displayName = 'GenerateButton';
