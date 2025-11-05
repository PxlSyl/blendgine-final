import React, { useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { AnimatePresence, motion } from 'framer-motion';
import { SortablePipelineItem } from './PipelineItem';

interface Pipeline {
  readonly id: string;
  readonly name: string;
  readonly distributionPercentage: number;
}

interface PipelineListProps {
  pipelines: readonly Pipeline[];
  activePipelineId: string;
  editingPipelineId: string | null;
  editingName: string;
  canDeletePipeline: boolean;
  onSetActivePipeline: (pipelineId: string) => void;
  onStartEdit: (pipeline: { id: string; name: string }) => void;
  onRemovePipeline: (pipelineId: string) => void;
  onDuplicatePipeline: (pipelineId: string, name: string) => void;
  onUpdatePipelineDistributionPercentage: (pipelineId: string, percentage: number) => void;
  onReorderPipelines?: (activeId: string, overId: string) => void;
  onSetEditingName: (name: string) => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  onSaveEdit: () => void;
}

export const PipelineList: React.FC<PipelineListProps> = ({
  pipelines,
  activePipelineId,
  editingPipelineId,
  editingName,
  canDeletePipeline,
  onSetActivePipeline,
  onStartEdit,
  onRemovePipeline,
  onDuplicatePipeline,
  onUpdatePipelineDistributionPercentage,
  onReorderPipelines,
  onSetEditingName,
  onKeyPress,
  onSaveEdit,
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id && onReorderPipelines) {
        const activeId = active.id.toString();
        const overId = over.id.toString();

        try {
          onReorderPipelines(activeId, overId);
        } catch (error) {
          console.error('Error reordering pipelines:', error);
        }
      }
    },
    [onReorderPipelines]
  );

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={pipelines.map((p) => p.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-4">
          {pipelines.map((pipeline) => {
            const isActive = pipeline.id === activePipelineId;
            const isEditing = editingPipelineId === pipeline.id;

            return (
              <AnimatePresence key={pipeline.id} mode="popLayout">
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.9 }}
                  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                >
                  <SortablePipelineItem
                    pipeline={pipeline}
                    isActive={isActive}
                    isEditing={isEditing}
                    editingName={editingName}
                    canDelete={canDeletePipeline}
                    allowDrag={true}
                    onSetActive={onSetActivePipeline}
                    onStartEdit={onStartEdit}
                    onRemove={onRemovePipeline}
                    onDuplicate={onDuplicatePipeline}
                    onUpdatePercentage={onUpdatePipelineDistributionPercentage}
                    onSetEditingName={onSetEditingName}
                    onKeyPress={onKeyPress}
                    onSaveEdit={onSaveEdit}
                  />
                </motion.div>
              </AnimatePresence>
            );
          })}
        </div>
      </SortableContext>
    </DndContext>
  );
};
