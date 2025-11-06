import { IncompatibilitySelectorType, RarityConfig, Tab, TintingOptions } from './effect';
import { ThemeName } from './themes';

export interface mainStoreState {
  darkMode: boolean;
  themeName: ThemeName;
  isCreateOpen: boolean;
  isManageOpen: boolean;
  isGenerating: boolean;
  message: string;
  step: number;
  introStage: number;
  activeTab: Tab;
  activeSection: string;
  showExtraButtons: boolean;
  showTooltips: boolean;
  sidebarFull: boolean;
}

export interface mainStoreActions {
  setDarkMode: (darkMode: boolean) => Promise<void>;
  setThemeName: (themeName: ThemeName) => Promise<void>;
  loadPreferences: () => Promise<void>;
  setIsCreateOpen: (isOpen: boolean) => void;
  setIsManageOpen: (isOpen: boolean) => void;
  setIsGenerating: (isGenerating: boolean) => void;
  setMessage: (message: string) => void;
  setStep: (step: number) => void;
  setIntroStage: (stage: number) => void;
  setActiveTab: (tab: Tab) => void;
  setActiveSection: (section: string) => void;
  setShowExtraButtons: (show: boolean) => void;
  setShowTooltips: (show: boolean) => Promise<void>;
  setSidebarFull: (full: boolean) => void;
}

export interface SaveLoadState {
  isSaving: boolean;
  isLoading: boolean;
  collectionName?: string;
  collectionDescription?: string;
  nftCount?: number;
  selectedFolder?: string;
  exportFolder?: string;
  orderedLayers?: string[];
  rarityConfig?: RarityConfig;
  finalWidth?: number;
  finalHeight?: number;
  fixedProportion?: boolean;
  imageFormat?: string;
  incompatibilities?: Record<string, Record<string, Record<string, string[]>>>;
  incompatibilitySelectors?: IncompatibilitySelectorType[];
  tintingOptions?: TintingOptions;
}

export interface SaveLoadActions {
  saveProjectConfig: () => Promise<void>;
  loadProjectConfig: () => Promise<void>;
}

export interface ImageContent {
  name: string;
  path: string;
}

export interface LayerContent {
  name: string;
  images: ImageContent[];
}

export type SetOrderedLayersArg =
  | string[]
  | {
      layers: string[];
      nftCount: number;
    };
