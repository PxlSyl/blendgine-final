import { useCallback } from 'react';
import type { CombinationSelectorType } from '../index';

interface UseSelectionHandlersProps {
  id: number;
  updateSelector: (id: number, updates: Partial<CombinationSelectorType>) => void;
}

export const useSelectionHandlers = ({ id, updateSelector }: UseSelectionHandlersProps) => {
  const handleFirstCategoryChange = useCallback(
    (value: string) => {
      updateSelector(id, { firstCategory: value, firstItem: '' });
    },
    [id, updateSelector]
  );

  const handleFirstItemChange = useCallback(
    (value: string) => {
      updateSelector(id, { firstItem: value });
    },
    [id, updateSelector]
  );

  const handleSecondCategoryChange = useCallback(
    (value: string) => {
      updateSelector(id, { secondCategory: value, secondItem: '' });
    },
    [id, updateSelector]
  );

  const handleSecondItemChange = useCallback(
    (value: string) => {
      updateSelector(id, { secondItem: value });
    },
    [id, updateSelector]
  );

  return {
    handleFirstCategoryChange,
    handleFirstItemChange,
    handleSecondCategoryChange,
    handleSecondItemChange,
  };
};
