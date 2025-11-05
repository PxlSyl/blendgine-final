import { create } from 'zustand';

interface MetadataJsonData {
  name?: string;
  description?: string;
  image?: string;
  attributes?: Array<{
    trait_type: string;
    value: string;
  }>;
  [key: string]: unknown;
}

export interface State {
  metadataStep: number;
  collectionHostingUrl: string;
  collectionName: string;
  collectionDescription: string;
  targetBlockchain: string;
  jsonData: MetadataJsonData | null;
  filePath: string | null;
  newFieldKey: string;
  newFieldValue: string;
  newTraitType: string;
  newAttributeValue: string;
  actionType: 'create' | 'update' | null;
  isCreateFromScratchClicked: boolean;
}

export interface Actions {
  setMetadataStep: (newStep: number) => void;
  setCollectionHostingUrl: (url: string) => void;
  updateCollectionName: (name: string) => void;
  updateCollectionDescription: (description: string) => void;
  setJsonData: (data: MetadataJsonData | null) => void;
  setFilePath: (path: string | null) => void;
  setNewFieldKey: (key: string) => void;
  setNewFieldValue: (value: string) => void;
  setNewTraitType: (type: string) => void;
  setNewAttributeValue: (value: string) => void;
  setActionType: (type: 'create' | 'update' | null) => void;
  setIsCreateFromScratchClicked: (clicked: boolean) => void;
}

export const useUpdateStore = create<State & Actions>((set) => ({
  metadataStep: 1,
  targetBlockchain: 'ethereum',
  collectionHostingUrl: '',
  collectionName: '',
  collectionDescription: '',
  jsonData: null,
  filePath: null,
  newFieldKey: '',
  newFieldValue: '',
  newTraitType: '',
  newAttributeValue: '',
  actionType: null,
  isCreateFromScratchClicked: false,
  setMetadataStep: (newStep) => set({ metadataStep: newStep }),
  setCollectionHostingUrl: (url) => set({ collectionHostingUrl: url }),
  updateCollectionName: (name) => set({ collectionName: name }),
  updateCollectionDescription: (description) => set({ collectionDescription: description }),
  setJsonData: (data) => set({ jsonData: data }),
  setFilePath: (path) => set({ filePath: path }),
  setNewFieldKey: (key) => set({ newFieldKey: key }),
  setNewFieldValue: (value) => set({ newFieldValue: value }),
  setNewTraitType: (type) => set({ newTraitType: type }),
  setNewAttributeValue: (value) => set({ newAttributeValue: value }),
  setActionType: (type) => set({ actionType: type }),
  setIsCreateFromScratchClicked: (clicked) => set({ isCreateFromScratchClicked: clicked }),
}));
