import { StateCreator } from 'zustand';

import type { LayerOrderState, LayerOrderActions } from '../types';
import type { SetOrder } from '@/schemas/effect/layerOrder';

export interface SetOrderSlice {
  setOrders: SetOrder[];
  reorderSets: (activeId: string, overId: string) => void;
  initializeSetOrders: () => void;
}

export const createSetOrderSlice: StateCreator<
  LayerOrderState & LayerOrderActions,
  [],
  [],
  SetOrderSlice
> = (set) => ({
  setOrders: [],

  reorderSets: (activeId: string, overId: string) => {
    set((state) => {
      const oldIndex = state.setOrders.findIndex((item) => item.id === activeId);
      const newIndex = state.setOrders.findIndex((item) => item.id === overId);

      const newOrders = [...state.setOrders];
      const [movedItem] = newOrders.splice(oldIndex, 1);
      newOrders.splice(newIndex, 0, movedItem);

      const updatedOrders = newOrders.map((item, index) => ({
        ...item,
        order: index,
      }));

      return {
        ...state,
        setOrders: updatedOrders,
      };
    });
  },

  initializeSetOrders: () => {
    try {
      set((state) => {
        if (state.setOrders.length > 0) {
          const currentSetIds = Object.keys(state.sets);
          const existingSetIds = state.setOrders.map((order) => order.id);

          if (
            currentSetIds.length === existingSetIds.length &&
            currentSetIds.every((id) => existingSetIds.includes(id))
          ) {
            return state;
          }
        }

        const { sets } = state;
        if (!sets || Object.keys(sets).length === 0) {
          console.warn('No sets available for initialization');
          return state;
        }

        const setOrders = Object.keys(sets).map((id, index) => ({
          id,
          order: index,
        }));

        return {
          ...state,
          setOrders,
        };
      });
    } catch (error) {
      console.error('Error initializing set orders:', error);
    }
  },
});
