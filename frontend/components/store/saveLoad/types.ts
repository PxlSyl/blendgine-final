import type {
  AnimationQualityConfig,
  ForcedCombinationsBySets,
  IncompatibilitiesBySets,
  OrderedLayersSets,
  RarityConfig,
  ResizeConfig,
  SolanaMetadataConfig,
  SpritesheetLayout,
} from '@/types/effect';

export interface ProjectConfig {
  collectionName: string;
  collectionDescription: string;
  selectedFolder: string;
  exportFolder: string;
  orderedLayersSets: OrderedLayersSets;
  activeSet: string;
  rarityConfig: RarityConfig;
  baseWidth: number;
  baseHeight: number;
  finalWidth: number;
  finalHeight: number;
  fixedProportion: boolean;
  imageFormat: string;
  incompatibilitiesBySets: IncompatibilitiesBySets;
  forcedCombinationsBySets: ForcedCombinationsBySets;
  targetBlockchain?: string;
  includeRarity?: boolean;
  maxFrames?: number;
  isAnimatedCollection?: boolean;
  spritesheetLayout?: SpritesheetLayout;
  projectId?: string;
  availableSets?: number[];
  includeSpritesheets?: boolean;
  allowDuplicates?: boolean;
  shuffleSets?: boolean;
  blockchain?: 'eth' | 'sol';
  solanaConfig?: SolanaMetadataConfig;
  animationQuality?: AnimationQualityConfig | null;
  resizeConfig?: ResizeConfig | null;
  sets?: Record<
    string,
    {
      id: string;
      name: string;
      customName?: string;
      createdAt: string;
      layers: string[];
      nftCount: number;
    }
  >;
  activeSetId?: string;
  setOrders?: Array<{ id: string; order: number }>;
}
