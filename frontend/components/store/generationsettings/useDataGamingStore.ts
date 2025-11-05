import { create } from 'zustand';

import type { DataGamingState, DataGamingActions, GameAttribute } from './types';

const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

type DataGamingStore = DataGamingState & DataGamingActions;

export const useDataGamingStore = create<DataGamingStore>((set) => ({
  headers: [{ id: generateUUID(), name: 'attributes', attributes: [] }],
  isTypeOpen: {},
  currentTextValue: '',

  addHeader: () =>
    set((state) => ({
      headers: [
        ...state.headers,
        {
          id: generateUUID(),
          name: `header_${state.headers.length + 1}`,
          attributes: [],
        },
      ],
    })),

  removeHeader: (headerId) =>
    set((state) => ({
      headers: state.headers.filter((header) => header.id !== headerId),
    })),

  updateHeaderName: (headerId, name) =>
    set((state) => ({
      headers: state.headers.map((header) =>
        header.id === headerId ? { ...header, name } : header
      ),
    })),

  addAttribute: (headerId) =>
    set((state) => ({
      headers: state.headers.map((header) => {
        if (header.id === headerId) {
          return {
            ...header,
            attributes: [
              ...header.attributes,
              {
                id: generateUUID(),
                trait_type: '',
                type: 'text',
                isRandomMode: false,
                arrayMode: 'multiple_arrays',
                arraySize: 1,
              },
            ],
          };
        }
        return header;
      }),
    })),

  removeAttribute: (headerId, attributeId) =>
    set((state) => ({
      headers: state.headers.map((header) => {
        if (header.id === headerId) {
          return {
            ...header,
            attributes: header.attributes.filter((attr) => attr.id !== attributeId),
          };
        }
        return header;
      }),
    })),

  updateAttribute: (headerId, attributeId, updates) =>
    set((state) => ({
      headers: state.headers.map((header) => {
        if (header.id === headerId) {
          return {
            ...header,
            attributes: header.attributes.map((attr) =>
              attr.id === attributeId ? { ...attr, ...updates } : attr
            ),
          };
        }
        return header;
      }),
    })),

  setCurrentTextValue: (value) => set({ currentTextValue: value }),

  toggleTypeDropdown: (id) =>
    set((state) => ({
      isTypeOpen: {
        ...state.isTypeOpen,
        [id]: !state.isTypeOpen[id],
      },
    })),

  handleArrayValueChange: (headerId, attributeId, value) =>
    set((state) => {
      const values = value
        .split(',')
        .map((v) => v.trim())
        .filter((v) => v !== '')
        .reduce(
          (acc, curr) => ({
            ...acc,
            [generateUUID()]: curr,
          }),
          {}
        );

      return {
        headers: state.headers.map((header) => {
          if (header.id === headerId) {
            return {
              ...header,
              attributes: header.attributes.map((attr) =>
                attr.id === attributeId ? { ...attr, arrayValues: values } : attr
              ),
            };
          }
          return header;
        }),
      };
    }),

  handleTextValueChange: (headerId, attributeId, value) =>
    set((state) => {
      const values = value
        .split(',')
        .map((v) => v.trim())
        .filter((v) => v !== '')
        .reduce(
          (acc, curr) => ({
            ...acc,
            [generateUUID()]: curr,
          }),
          {}
        );

      return {
        headers: state.headers.map((header) => {
          if (header.id === headerId) {
            return {
              ...header,
              attributes: header.attributes.map((attr) =>
                attr.id === attributeId
                  ? {
                      ...attr,
                      textValues: {
                        ...(attr.textValues ?? {}),
                        ...values,
                      },
                    }
                  : attr
              ),
            };
          }
          return header;
        }),
      };
    }),

  toggleRandomMode: (headerId, attributeId) =>
    set((state) => ({
      headers: state.headers.map((header) => {
        if (header.id === headerId) {
          return {
            ...header,
            attributes: header.attributes.map((attr) =>
              attr.id === attributeId ? { ...attr, isRandomMode: !attr.isRandomMode } : attr
            ),
          };
        }
        return header;
      }),
    })),

  setArrayMode: (headerId, attributeId, mode) =>
    set((state) => ({
      headers: state.headers.map((header) => {
        if (header.id === headerId) {
          return {
            ...header,
            attributes: header.attributes.map((attr) =>
              attr.id === attributeId ? { ...attr, arrayMode: mode } : attr
            ),
          };
        }
        return header;
      }),
    })),

  setArraySize: (headerId, attributeId, size) =>
    set((state) => ({
      headers: state.headers.map((header) => {
        if (header.id === headerId) {
          return {
            ...header,
            attributes: header.attributes.map((attr) =>
              attr.id === attributeId ? { ...attr, arraySize: size } : attr
            ),
          };
        }
        return header;
      }),
    })),

  canEnableRandom: (attribute: GameAttribute) => {
    if (attribute.type === 'text') {
      return Object.keys(attribute.textValues ?? {}).length >= 2;
    }

    if (attribute.type === 'number') {
      return (
        typeof attribute.min === 'number' &&
        typeof attribute.max === 'number' &&
        attribute.min < attribute.max
      );
    }

    return false;
  },
}));
