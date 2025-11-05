import React from 'react';
import { PlusCircleIcon, EyeOpenIcon } from '@/components/icons';
import { ActionButton } from '@/components/shared/ActionButton';

interface Pipeline {
  readonly id: string;
  readonly effects: readonly { readonly enabled: boolean }[];
}

interface PipelineHeaderProps {
  activePipeline: Pipeline | undefined;
  sourceFolder: string | null;
  onAddPipeline: () => void;
  onGeneratePreview: () => Promise<void>;
}

export const PipelineHeader: React.FC<PipelineHeaderProps> = ({
  activePipeline,
  sourceFolder,
  onAddPipeline,
  onGeneratePreview,
}) => {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="text-md sm:text-lg font-semibold text-[rgb(var(--color-primary))] mb-2">
        Effect Pipelines
      </div>
      <div className="flex space-x-2">
        <ActionButton
          onClick={onAddPipeline}
          icon={PlusCircleIcon}
          label="Add"
          description="Add a new pipeline"
          color="purple"
        />
        {activePipeline && activePipeline.effects.length > 0 && sourceFolder && (
          <ActionButton
            onClick={() => void onGeneratePreview()}
            icon={EyeOpenIcon}
            label="Preview"
            description="Preview active pipeline"
            color="pink"
          />
        )}
      </div>
    </div>
  );
};
