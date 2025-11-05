import React from 'react';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import DraggableLayer from './DraggableLayer';
import { useProjectSetup } from '@/components/store/projectSetup/hook';

interface LayerListProps {
  activeSet: string;
  orderedLayersSets: Record<string, { layers: string[] }>;
  onLayerMove: (oldIndex: number, newIndex: number) => void;
}

const LayerList: React.FC<LayerListProps> = ({ activeSet, orderedLayersSets, onLayerMove }) => {
  const { layerImages } = useProjectSetup();

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = orderedLayersSets[activeSet].layers.indexOf(active.id as string);
      const newIndex = orderedLayersSets[activeSet].layers.indexOf(over.id as string);
      onLayerMove(oldIndex, newIndex);
    }
  };

  const handleMoveUp = (index: number) => {
    if (index > 0) {
      onLayerMove(index, index - 1);
    }
  };

  const handleMoveDown = (index: number) => {
    if (index < orderedLayersSets[activeSet].layers.length - 1) {
      onLayerMove(index, index + 1);
    }
  };

  return (
    <div className="h-full">
      <div className="h-full rounded-sm shadow-lg overflow-y-auto bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-purple-100 dark:border-gray-700/50">
        <div className="p-2">
          <DndContext
            key={`dnd-${activeSet}`}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={orderedLayersSets[activeSet]?.layers || []}
              strategy={verticalListSortingStrategy}
            >
              {orderedLayersSets[activeSet]?.layers.map((layer, index) => {
                const layerImageData = layerImages.find((l) => l.layerName === layer);
                const imageInfos = layerImageData?.imageInfos ?? [];

                return (
                  <DraggableLayer
                    key={`${layer}-${activeSet}`}
                    layer={layer}
                    index={index}
                    onMoveUp={handleMoveUp}
                    onMoveDown={handleMoveDown}
                    isLastLayer={index === orderedLayersSets[activeSet].layers.length - 1}
                    imageInfos={imageInfos}
                  />
                );
              })}
            </SortableContext>
          </DndContext>
          {(!orderedLayersSets[activeSet]?.layers ||
            orderedLayersSets[activeSet]?.layers.length === 0) && (
            <p className="text-gray-500 dark:text-gray-400 italic">No layers added yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default LayerList;
