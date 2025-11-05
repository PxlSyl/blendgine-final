import { useMemo } from 'react';

import { useLayerOrder } from '@/components/store/layerOrder/hook';
import { useRarity } from '@/components/store/rarityStore/hook';

interface UseSetSelectorProps {
  includeGlobalView?: boolean;
}

export const useSetSelector = (props: UseSetSelectorProps = {}) => {
  const { includeGlobalView = false } = props;

  const {
    activeSetId,
    sets,
    setActiveSet,
    deleteSet,
    addSet,
    duplicateSet,
    setCustomSetName,
    loadRarityConfig,
    setOrders,
  } = useLayerOrder();

  const availableSets = useMemo(() => {
    if (setOrders.length === 0) {
      return Object.keys(sets)
        .map((setId) => parseInt(setId.replace('set', '')))
        .filter((num) => !isNaN(num))
        .sort((a, b) => a - b);
    }
    return setOrders
      .sort((a, b) => a.order - b.order)
      .map(({ id }) => parseInt(id.replace('set', ''), 10))
      .filter((num) => !isNaN(num));
  }, [sets, setOrders]);

  const { isGlobalViewActive, toggleGlobalView } = useRarity();

  const customNames = Object.entries(sets).reduce(
    (acc, [setId, setInfo]) => {
      if (setInfo.customName) {
        acc[setId] = setInfo.customName;
      }
      return acc;
    },
    {} as Record<string, string>
  );

  const handleSetClick = (setNumber: number) => {
    setActiveSet(setNumber);
    void loadRarityConfig();

    if (includeGlobalView && isGlobalViewActive) {
      toggleGlobalView();
    }
  };

  const handleDelete = (setNumber: number) => {
    deleteSet(setNumber);
    void loadRarityConfig();
  };

  const handleAdd = () => {
    addSet();
    void loadRarityConfig();
  };

  const handleDuplicate = (setNumber: number) => {
    duplicateSet(setNumber);
    void loadRarityConfig();
  };

  const handleRename = (setNumber: number, newName: string) => {
    setCustomSetName(setNumber, newName);
  };

  return {
    activeSet: activeSetId ?? 'set1',
    availableSets,
    customNames,

    onSetClick: handleSetClick,

    onRename: handleRename,
    onDelete: handleDelete,
    onAdd: handleAdd,
    onDuplicate: handleDuplicate,

    isGlobalActive: includeGlobalView ? isGlobalViewActive : false,
    onGlobalClick: includeGlobalView ? toggleGlobalView : () => {},

    stores: {
      layerOrder: {
        activeSetId,
        setActiveSet,
        deleteSet,
        addSet,
        duplicateSet,
        sets,
        setCustomSetName,
        loadRarityConfig,
      },
      globalRarity: { isGlobalViewActive, toggleGlobalView },
    },
  };
};
