import {
  ProjectIcon,
  LayersIcon,
  RarityIcon,
  EffectsIcon,
  LegendaryIcon,
  BulkEditIcon,
  ChartIcon,
  EditIcon,
} from '@/components/icons/StepIcons';
import { RefreshIcon } from '@/components/icons';

export const createsteps = [
  { id: 1, label: 'Project', icon: <ProjectIcon className="w-5 h-4" /> },
  { id: 2, label: 'Layers', icon: <LayersIcon className="w-5 h-5" /> },
  { id: 3, label: 'Rarity', icon: <RarityIcon className="w-5 h-5" /> },
  { id: 4, label: 'Generation', icon: <RefreshIcon className="w-5 h-5" /> },
  { id: 5, label: 'Effects', icon: <EffectsIcon className="w-5 h-5" /> },
  { id: 6, label: 'Legendary', icon: <LegendaryIcon className="w-5 h-7" /> },
];

export const managesteps = [
  { id: 1, label: 'Rarity', icon: <ChartIcon className="w-5 h-5" /> },
  { id: 2, label: 'Single file', icon: <EditIcon className="w-5 h-5" /> },
  { id: 3, label: 'Bulk editing', icon: <BulkEditIcon className="w-5 h-5" /> },
];
