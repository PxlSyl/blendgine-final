import { create } from 'zustand';

interface IsSelectedState {
  hasSelectedFolder: boolean;
  setHasSelectedFolder: (isSelected: boolean) => void;
}

export const useIsSelectedStore = create<IsSelectedState>((set) => ({
  hasSelectedFolder: false,
  setHasSelectedFolder: (isSelected: boolean) => set({ hasSelectedFolder: isSelected }),
}));
