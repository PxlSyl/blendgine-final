import * as CharsetCategories from './asciiChartsetPresets';
import { AsciiCharsetPreset } from './asciiChartsetPresets/type';

interface CharsetCategory {
  name: string;
  presets: AsciiCharsetPreset[];
}

export const categories: CharsetCategory[] = [
  { name: 'Living Languages', presets: CharsetCategories.LIVING_LANGUAGES },
  { name: 'Ancient Languages', presets: CharsetCategories.ANCIENT_LANGUAGES },
  { name: 'Classic ASCII', presets: CharsetCategories.CLASSIC_ASCII },
  { name: 'Classic Math ASCII', presets: CharsetCategories.CLASSIC_MATH_ASCII },
  { name: 'Unicode Block', presets: CharsetCategories.UNICODE_BLOCK },
];
