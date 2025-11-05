import React from 'react';
import { motion } from 'framer-motion';
import { PipelineHeader } from './components/PipelineHeader';
import { PipelineList } from './components/PipelineList';
import { usePipelineSelector } from './hooks';

interface PipelineSelectorProps {
  className?: string;
}

const PipelineSelector: React.FC<PipelineSelectorProps> = ({ className = '' }) => {
  const {
    tintingOptions,
    sourceFolder,
    editingPipelineId,
    editingName,
    activePipeline,
    canDeletePipeline,

    handleAddPipeline,
    handleRemovePipeline,
    handleStartEdit,
    handleSaveEdit,
    handleKeyPress,
    handleGeneratePreview,

    setActivePipeline,
    duplicatePipeline,
    updatePipelineDistributionPercentage,
    reorderPipelines,
    setEditingName,
    getTotalPercentage,
  } = usePipelineSelector();

  return (
    <>
      <PipelineHeader
        activePipeline={activePipeline}
        sourceFolder={sourceFolder}
        onAddPipeline={handleAddPipeline}
        onGeneratePreview={handleGeneratePreview}
      />
      <motion.div
        className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 ${className}`}
        layout
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      >
        <PipelineList
          pipelines={tintingOptions.pipelines}
          activePipelineId={tintingOptions.activePipelineId ?? ''}
          editingPipelineId={editingPipelineId}
          editingName={editingName}
          canDeletePipeline={canDeletePipeline}
          onSetActivePipeline={setActivePipeline}
          onStartEdit={handleStartEdit}
          onRemovePipeline={handleRemovePipeline}
          onDuplicatePipeline={duplicatePipeline}
          onUpdatePipelineDistributionPercentage={updatePipelineDistributionPercentage}
          onReorderPipelines={reorderPipelines}
          onSetEditingName={setEditingName}
          onKeyPress={handleKeyPress}
          onSaveEdit={handleSaveEdit}
        />
        <motion.div
          className="mt-4 text-right text-sm font-bold text-gray-600 dark:text-gray-300"
          layout
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        >
          Total:{' '}
          <span className="text-[rgb(var(--color-secondary))] ml-2 mr-4">
            {getTotalPercentage().toFixed(2)}%
          </span>
        </motion.div>
      </motion.div>
    </>
  );
};

export default PipelineSelector;
