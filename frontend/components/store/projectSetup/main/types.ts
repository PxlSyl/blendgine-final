import type { ProjectSetupState } from '@/types/effect';

export interface InputField {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
}

export interface ProjectSetupActions {
  updateProjectSetup: (updates: Partial<ProjectSetupState>) => void;
  resetProjectSetup: () => void;
  loadPersistedState: () => Promise<void>;
  saveState: () => Promise<void>;
  validateAndReloadLayers: (folderPath: string) => Promise<void>;
  handleSelectFolder: () => Promise<void>;
  handleSelectExportFolder: () => Promise<void>;
  handleCollectionNameChange: (name: string) => void;
  handleCollectionDescriptionChange: (description: string) => void;
  setShowContent: (show: boolean) => void;
  setErrorMessage: (message: string | null) => void;
  getInputFields: () => InputField[];
  setIncludeRarity: (include: boolean) => void;
  setMaxFrames: (frames: number) => void;
  setSelectedFolder: (folder: string | null) => void;
  setIsAnimatedCollection: (value: boolean) => void;
}
