import { StateCreator } from 'zustand';

export interface UISlice {
  expandedFilters: Set<string>;
  isAddFilterModalOpen: boolean;
  toggleFilterExpansion: (filterId: string) => void;
  expandAllFilters: (filterIds: string[]) => void;
  collapseAllFilters: () => void;
  setIsAddFilterModalOpen: (isOpen: boolean) => void;
}

export const createUISlice: StateCreator<UISlice> = (set) => ({
  expandedFilters: new Set<string>(),
  isAddFilterModalOpen: false,

  toggleFilterExpansion: (filterId: string) => {
    set((state) => {
      const newExpandedFilters = new Set(state.expandedFilters);
      if (newExpandedFilters.has(filterId)) {
        newExpandedFilters.delete(filterId);
      } else {
        newExpandedFilters.add(filterId);
      }
      return { expandedFilters: newExpandedFilters };
    });
  },

  expandAllFilters: (filterIds: string[]) => {
    set({ expandedFilters: new Set(filterIds) });
  },

  collapseAllFilters: () => {
    set({ expandedFilters: new Set() });
  },

  setIsAddFilterModalOpen: (isOpen: boolean) => {
    set({ isAddFilterModalOpen: isOpen });
  },
});
