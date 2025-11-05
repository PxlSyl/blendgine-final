import type { ProjectSetupState } from '@/types/effect';

export const initialState: ProjectSetupState = {
  collectionName: '',
  collectionDescription: '',
  selectedFolder: '',
  exportFolder: '',
  includeRarity: true,
  maxFrames: 1,
  isAnimatedCollection: false,
  spritesheetLayout: undefined,
  showContent: false,
  errorMessage: undefined,
  projectId: crypto.randomUUID?.() || `project-${Date.now()}`,
};
