import { create } from 'zustand';

import { api } from '@/services';

import { joinPaths } from '../../../utils/functionsUtils';

interface LegendaryNFTStoreState {
  legendaryFolder: string;
  exportFolder: string;
  errorMessage: string | null;
  showContent: boolean;
  isMixComplete: boolean;
  resetLegendaryNFTStore: () => void;
  setLegendaryFolder: (folder: string) => void;
  setExportFolder: (folder: string) => void;
  setErrorMessage: (message: string | null) => void;
  setShowContent: (show: boolean) => void;
  setIsMixComplete: (complete: boolean) => void;
  checkFolderValidity: (folderPath: string) => Promise<{ isValid: boolean; errorMessage?: string }>;
  validateLegendaryFolder: (folder: string) => Promise<boolean>;
  initExportFolder: (filterDestinationFolder: string, projectExportFolder: string) => Promise<void>;
  selectLegendaryFolder: () => Promise<void>;
  selectExportFolder: () => Promise<void>;
}

export const useLegendaryNFTStore = create<LegendaryNFTStoreState>((set, get) => ({
  legendaryFolder: '',
  exportFolder: '',
  errorMessage: null,
  showContent: false,
  isMixComplete: false,

  resetLegendaryNFTStore: () => {
    set({
      legendaryFolder: '',
      exportFolder: '',
      errorMessage: null,
      showContent: false,
      isMixComplete: false,
    });
  },

  setLegendaryFolder: (folder) => set({ legendaryFolder: folder }),
  setExportFolder: (folder) => set({ exportFolder: folder }),
  setErrorMessage: (message) => set({ errorMessage: message }),
  setShowContent: (show) => set({ showContent: show }),
  setIsMixComplete: (complete) => set({ isMixComplete: complete }),
  checkFolderValidity: async (folderPath) => {
    try {
      const result = await api.readFolder(folderPath);
      if (!result.isValid) {
        console.error(result.errorMessage);
      }
      return { isValid: result.isValid, errorMessage: result.errorMessage };
    } catch (error) {
      console.error('Error checking folder validity:', error);
      return { isValid: false, errorMessage: 'An error occurred while checking the folder.' };
    }
  },
  validateLegendaryFolder: async (folder) => {
    try {
      const structure = await api.validateLegendaryNFTsFolder(folder);
      if (!structure.isValid) {
        set({
          errorMessage:
            structure.errorMessage ??
            "The selected folder doesn't have the correct structure for legendary NFTs.",
        });
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error validating legendary folder:', error);
      set({
        errorMessage:
          'An error occurred while validating the legendary NFTs folder. Please try again.',
      });
      return false;
    }
  },

  initExportFolder: async (filterDestinationFolder, projectExportFolder) => {
    const { checkFolderValidity, setExportFolder } = get();
    if (filterDestinationFolder) {
      const result = await checkFolderValidity(filterDestinationFolder);
      if (result.isValid) {
        setExportFolder(filterDestinationFolder);
        return;
      }
    }
    if (projectExportFolder) {
      const collectionPath = joinPaths(projectExportFolder, 'Collection');
      const result = await checkFolderValidity(collectionPath);
      if (result.isValid) {
        setExportFolder(collectionPath);
        return;
      }
    }
    setExportFolder('');
  },
  selectLegendaryFolder: async () => {
    const { validateLegendaryFolder, setLegendaryFolder, setErrorMessage } = get();
    try {
      const folder = await api.selectLegendaryNFTsFolder();
      if (folder) {
        const isValid = await validateLegendaryFolder(folder);
        if (!isValid) {
          return;
        }
        setLegendaryFolder(folder);
        setErrorMessage(null);
      }
    } catch (error) {
      console.error('Error in selectLegendaryFolder:', error);
      setErrorMessage(
        'An error occurred while selecting the legendary NFTs folder. Please try again.'
      );
    }
  },
  selectExportFolder: async () => {
    const { checkFolderValidity, setExportFolder, setErrorMessage } = get();
    try {
      const folder = await api.selectFolder();
      if (folder) {
        const isValid = await checkFolderValidity(folder);
        if (!isValid) {
          setErrorMessage("The selected folder doesn't have the correct structure.");
          return;
        }
        setExportFolder(folder);
        setErrorMessage(null);
      }
    } catch (error) {
      console.error('Error in selectExportFolder:', error);
      setErrorMessage('An error occurred while selecting the export folder. Please try again.');
    }
  },
}));
