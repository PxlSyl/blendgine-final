import type {
  AnimationQualityConfig,
  ResizeConfig,
  SolanaCreator,
  SolanaMetadataConfig,
  ImageSetupPersistentState as EffectImageSetupPersistentState,
  ImageSetupState as EffectImageSetupState,
  DataGamingState as EffectDataGamingState,
  GameAttribute as EffectGameAttribute,
  GameHeader as EffectGameHeader,
} from '@/types/effect';

export type ImageSetupPersistentState = EffectImageSetupPersistentState & {
  resizeConfig?: ResizeConfig | null;
};

export type ImageSetupState = EffectImageSetupState & {
  resizeConfig: ResizeConfig | undefined;
  solanaConfig: SolanaMetadataConfig | undefined;
  animationQuality: AnimationQualityConfig | undefined;
};

export interface ImageSetupActions {
  setImageFormat: (format: string) => void;
  setBaseDimensions: (width: number, height: number) => void;
  setFinalDimensions: (width: number, height: number) => void;
  setFixedProportion: (fixed: boolean) => void;
  loadPersistedState: () => Promise<void>;
  saveState: () => Promise<void>;
  validateDimensions: () => boolean;
  validateConfiguration: () => boolean;
  handleWidthChange: (newWidth: number) => void;
  handleHeightChange: (newHeight: number) => void;
  toggleFormatDropdown: () => void;
  closeFormatDropdown: () => void;
  getSliderPercentage: (value: number) => number;
  validateAndPrepareGeneration: () => boolean;
  resetState: () => void;
  calculateAspectRatio: (
    width: number,
    height: number
  ) => {
    width: number;
    height: number;
  };
  setAllowDuplicates: (allow: boolean) => void;
  setShuffleSets: (value: boolean) => void;
  selectBlockchain: (blockchain: 'eth' | 'sol') => void;
  updateSolanaConfig: (config: Partial<SolanaMetadataConfig>) => void;
  updateSolanaCreator: (index: number, creator: Partial<SolanaCreator>) => void;
  addSolanaCreator: () => void;
  removeSolanaCreator: (index: number) => void;
  updateFormats: () => void;
  setIncludeSpritesheets: (value: boolean) => void;
  updateAnimationQuality: (config: Partial<AnimationQualityConfig>) => void;
  updateResizeConfig: (config: Partial<ResizeConfig>) => void;
  resetGenerationStore: () => Promise<void>;
  getMaxImageSize: () => number;
  readonly MIN_IMAGE_SIZE: number;
}

export type DataGamingState = EffectDataGamingState;
export type GameAttribute = EffectGameAttribute;
export type GameHeader = EffectGameHeader;

export interface DataGamingActions {
  addHeader: () => void;
  removeHeader: (headerId: string) => void;
  updateHeaderName: (headerId: string, name: string) => void;
  addAttribute: (headerId: string) => void;
  removeAttribute: (headerId: string, attributeId: string) => void;
  updateAttribute: (headerId: string, attributeId: string, updates: Partial<GameAttribute>) => void;
  setCurrentTextValue: (value: string) => void;
  toggleTypeDropdown: (id: string) => void;
  handleArrayValueChange: (headerId: string, attributeId: string, value: string) => void;
  handleTextValueChange: (headerId: string, attributeId: string, value: string) => void;
  toggleRandomMode: (headerId: string, attributeId: string) => void;
  setArrayMode: (
    headerId: string,
    attributeId: string,
    mode: 'multiple_arrays' | 'random_texts'
  ) => void;
  setArraySize: (headerId: string, attributeId: string, size: number) => void;
  canEnableRandom: (attribute: GameAttribute) => boolean;
}
