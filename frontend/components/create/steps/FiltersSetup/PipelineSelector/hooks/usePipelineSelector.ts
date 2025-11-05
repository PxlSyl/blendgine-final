import { useState, useEffect } from 'react';
import { useFilters } from '@/components/store/filters/hook';
import { usePreviewCanvasStore } from '@/components/store/filters/preview';
import { usePipelinePreviewStore } from '@/components/store/filters/pipelinePreviews';

export const usePipelineSelector = () => {
  const {
    tintingOptions,
    sourceFolder,
    exportFormat,
    isAnimated,
    addPipeline,
    removePipeline,
    setActivePipeline,
    updatePipelineName,
    duplicatePipeline,
    updatePipelineDistributionPercentage,
    reorderPipelines,
    generatePreview,
    getTotalPercentage,
  } = useFilters();

  const { isSourceImageLocked, loadPipelinePreview, currentPipelineId, clearImages } =
    usePreviewCanvasStore();

  const { hasPipelinePreview, clearPipelinePreview } = usePipelinePreviewStore();

  const [editingPipelineId, setEditingPipelineId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const activePipeline = tintingOptions.pipelines.find(
    (p) => p.id === tintingOptions.activePipelineId
  );
  const canDeletePipeline = tintingOptions.pipelines.length > 1;

  useEffect(() => {
    if (activePipeline && activePipeline.id !== currentPipelineId) {
      const pipelineId = activePipeline.id;

      if (hasPipelinePreview(pipelineId)) {
        loadPipelinePreview(pipelineId);
      } else {
        clearImages();
      }
    }
  }, [
    activePipeline?.id,
    currentPipelineId,
    hasPipelinePreview,
    loadPipelinePreview,
    clearImages,
    activePipeline,
  ]);

  const handleAddPipeline = () => {
    const newName = `Pipeline ${tintingOptions.pipelines.length + 1}`;
    addPipeline(newName);
    clearImages();
  };

  const handleRemovePipeline = (pipelineId: string) => {
    if (canDeletePipeline) {
      clearPipelinePreview(pipelineId);
      removePipeline(pipelineId);
    }
  };

  const handleStartEdit = (pipeline: { id: string; name: string }) => {
    setEditingPipelineId(pipeline.id);
    setEditingName(pipeline.name);
  };

  const handleSaveEdit = () => {
    if (editingPipelineId && editingName.trim()) {
      updatePipelineName(editingPipelineId, editingName.trim());
      setEditingPipelineId(null);
      setEditingName('');
    }
  };

  const handleCancelEdit = () => {
    setEditingPipelineId(null);
    setEditingName('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const handleGeneratePreview = async () => {
    try {
      if (!activePipeline) {
        return;
      }

      const activeEffects = activePipeline.effects.filter((effect) => effect.enabled);

      if (!activeEffects || activeEffects.length === 0) {
        return;
      }

      if (!sourceFolder) {
        return;
      }

      await generatePreview({
        activePreview: 'Filters',
        effects: activeEffects,
        sourceFolder,
        isSourceImageLocked,
        exportFormat,
        isAnimated,
        pipelineId: activePipeline.id,
      });
    } catch (error) {
      console.error('Error generating pipeline preview:', error);
    }
  };

  return {
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
  };
};
