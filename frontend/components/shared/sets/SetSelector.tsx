import React, { useCallback, useEffect, useMemo } from 'react';
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
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';

import { useLayerOrder } from '../../store/layerOrder/hook';

import { SetButton } from './SetButton';
import { SortableSetButton } from './SortableSetButton';
import { GlobalButton } from './GlobalButton';
import { AddButton } from './AddButton';
import { useSetSelector } from './hook/useSetSelector';

export interface SetSelectorProps {
  availableSets?: number[];
  activeSet?: string;
  onSetClick?: (setNumber: number) => void;

  showGlobalButton?: boolean;
  isGlobalActive?: boolean;
  onGlobalClick?: () => void;

  allowRename?: boolean;
  allowDelete?: boolean;
  allowDuplicate?: boolean;
  onRename?: (setNumber: number, newName: string) => void;
  onDelete?: (setNumber: number) => void;
  onDuplicate?: (setNumber: number) => void;

  showAddButton?: boolean;
  onAdd?: () => void;

  customNames?: Record<string, string>;
  className?: string;
  containerClassName?: string;

  activeGradient?: string;
  activeBorderColor?: string;
  inactiveBorderColor?: string;

  useHook?: boolean;
  includeGlobalView?: boolean;

  allowDrag?: boolean;
  tooltipsDisabled?: boolean;
}

export const SetSelector: React.FC<SetSelectorProps> = ({
  availableSets: propAvailableSets,
  activeSet: propActiveSet,
  onSetClick: propOnSetClick,
  showGlobalButton = false,
  isGlobalActive: propIsGlobalActive,
  onGlobalClick: propOnGlobalClick,
  allowRename = false,
  allowDelete = false,
  allowDuplicate = false,
  onRename: propOnRename,
  onDelete: propOnDelete,
  onDuplicate: propOnDuplicate,
  showAddButton = false,
  onAdd: propOnAdd,
  customNames: propCustomNames,
  className = '',
  containerClassName = 'p-2 rounded-sm shadow-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-[rgb(var(--color-primary))]/20 dark:border-gray-700/50',
  activeGradient,
  activeBorderColor,
  inactiveBorderColor,
  useHook = true,
  includeGlobalView = false,
  allowDrag = true,
  tooltipsDisabled,
}) => {
  const hookData = useSetSelector({ includeGlobalView });

  const finalAvailableSets = useMemo(() => {
    return propAvailableSets ?? (useHook ? hookData.availableSets : []);
  }, [propAvailableSets, useHook, hookData.availableSets]);
  const finalActiveSet = propActiveSet ?? (useHook ? hookData.activeSet : '');
  const finalOnSetClick = propOnSetClick ?? (useHook ? hookData.onSetClick : () => {});
  const finalIsGlobalActive = propIsGlobalActive ?? (useHook ? hookData.isGlobalActive : false);
  const finalOnGlobalClick = propOnGlobalClick ?? (useHook ? hookData.onGlobalClick : () => {});
  const finalOnRename = allowRename
    ? (propOnRename ?? (useHook ? hookData.onRename : undefined))
    : undefined;
  const finalOnDelete = allowDelete
    ? (propOnDelete ?? (useHook ? hookData.onDelete : undefined))
    : undefined;
  const finalOnDuplicate = allowDuplicate
    ? (propOnDuplicate ?? (useHook ? hookData.onDuplicate : undefined))
    : undefined;
  const finalOnAdd = propOnAdd ?? (useHook ? hookData.onAdd : () => {});
  const finalCustomNames = propCustomNames ?? (useHook ? hookData.customNames : {});

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

  const store = useLayerOrder();
  const { setOrders } = store;

  const orderedSetNumbers = useMemo(() => {
    if (setOrders.length === 0) {
      return finalAvailableSets;
    }
    return setOrders
      .map((order) => parseInt(order.id.replace('set', ''), 10))
      .filter((num) => finalAvailableSets.includes(num));
  }, [setOrders, finalAvailableSets]);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        const activeId = active.id.toString();
        const overId = over.id.toString();

        try {
          store.reorderSets(activeId, overId);
          void store.saveState();
        } catch (error) {
          console.error('Error reordering sets:', error);
        }
      }
    },
    [store]
  );

  useEffect(() => {
    try {
      store.initializeSetOrders();
    } catch (error) {
      console.error('Error initializing set orders:', error);
    }
  }, [store]);

  useEffect(() => {
    const currentSetOrders = store.setOrders;
    const availableSetIds = finalAvailableSets.map((num) => `set${num}`);

    if (currentSetOrders.length !== availableSetIds.length) {
      store.initializeSetOrders();
    }
  }, [finalAvailableSets, store]);

  if (!allowDrag) {
    return (
      <div className={containerClassName}>
        <div className={`flex items-center gap-2 ${className}`}>
          <div className="w-full">
            <div className="flex flex-wrap items-center gap-2">
              {orderedSetNumbers.map((setNumber) => {
                const setId = `set${setNumber}`;
                return (
                  <div key={setNumber}>
                    <SetButton
                      setNumber={setNumber}
                      isActive={finalActiveSet === setId && !finalIsGlobalActive}
                      onClick={finalOnSetClick}
                      customName={finalCustomNames[setId]}
                      allowRename={allowRename}
                      onRename={finalOnRename}
                      allowDelete={allowDelete}
                      onDelete={finalOnDelete}
                      allowDuplicate={allowDuplicate}
                      onDuplicate={finalOnDuplicate}
                      activeGradient={activeGradient}
                      activeBorderColor={activeBorderColor}
                      inactiveBorderColor={inactiveBorderColor}
                      totalSetsCount={finalAvailableSets.length}
                      showDragHandle={false}
                      tooltipsDisabled={tooltipsDisabled}
                    />
                  </div>
                );
              })}
              {showAddButton && (
                <div className="flex items-center" style={{ alignSelf: 'center', height: '27px' }}>
                  <AddButton onClick={finalOnAdd} />
                </div>
              )}
              {showGlobalButton && finalAvailableSets.length > 1 && (
                <div className="mr-1">
                  <GlobalButton isActive={finalIsGlobalActive} onClick={finalOnGlobalClick} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={containerClassName}>
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="w-full">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={orderedSetNumbers.map((num) => `set${num}`)}
              strategy={horizontalListSortingStrategy}
            >
              <div className="flex flex-wrap items-center gap-2">
                {orderedSetNumbers.map((setNumber) => {
                  const setId = `set${setNumber}`;
                  return (
                    <div key={setNumber}>
                      <SortableSetButton
                        setNumber={setNumber}
                        isActive={finalActiveSet === setId && !finalIsGlobalActive}
                        onClick={finalOnSetClick}
                        customName={finalCustomNames[setId]}
                        allowRename={allowRename}
                        onRename={finalOnRename}
                        allowDelete={allowDelete}
                        onDelete={finalOnDelete}
                        allowDuplicate={allowDuplicate}
                        onDuplicate={finalOnDuplicate}
                        activeGradient={activeGradient}
                        activeBorderColor={activeBorderColor}
                        inactiveBorderColor={inactiveBorderColor}
                        totalSetsCount={finalAvailableSets.length}
                        allowDrag={allowDrag}
                        tooltipsDisabled={tooltipsDisabled}
                      />
                    </div>
                  );
                })}
                {showAddButton && (
                  <div
                    className="flex items-center"
                    style={{ alignSelf: 'center', height: '27px' }}
                  >
                    <AddButton onClick={finalOnAdd} />
                  </div>
                )}
                {showGlobalButton && finalAvailableSets.length > 1 && (
                  <div className="mr-1">
                    <GlobalButton isActive={finalIsGlobalActive} onClick={finalOnGlobalClick} />
                  </div>
                )}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      </div>
    </div>
  );
};
