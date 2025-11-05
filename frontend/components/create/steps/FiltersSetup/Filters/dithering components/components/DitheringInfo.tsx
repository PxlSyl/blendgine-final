import React from 'react';
import { InfoIcon } from '@/components/icons';
import { FilterInstance } from '@/schemas/effect/filters/common';

interface DitheringInfoProps {
  filter: FilterInstance;
}

export const DitheringInfo: React.FC<DitheringInfoProps> = ({ filter }) => {
  const getAlgorithmInfo = () => {
    if (!filter.ditherAlgorithm) {
      return null;
    }

    switch (filter.ditherAlgorithm) {
      case 'floydsteinberg':
        return 'Natural error diffusion, most popular algorithm.';

      case 'bayer':
        return 'Geometric repeating pattern, creates structured dithering.';

      case 'atkinson':
        return "Apple's version, more subtle and refined.";

      case 'jarvisjudiceninke':
        return 'High quality diffusion, slower but more accurate.';

      case 'bluenoise':
        return 'Simple blue noise dithering using pre-calculated noise pattern. Creates natural-looking dithering with minimal artifacts.';

      case 'sierra':
        return getSierraInfo();

      case 'clustereddot':
        return 'Halftone-style dithering, creates clustered dot patterns for printing.';

      case 'halftone':
        return 'Authentic pop art halftone effect, simulates traditional printing with circular dots.';

      case 'burke':
        return 'Fast error diffusion with reduced artifacts.';

      case 'stevensonarce':
        return 'High-quality error diffusion with 12-point pattern, produces smooth gradients with minimal artifacts.';

      case 'stucki':
        return 'Enhanced error diffusion similar to Jarvis-Judice-Ninke but with optimized weights for better quality.';

      default:
        return 'Select a dithering algorithm to apply to your image.';
    }
  };

  const getSierraInfo = () => {
    const variant = filter.sierraOptions?.variant;

    switch (variant) {
      case 'sierra2':
        return 'Sierra-2 variant with improved error distribution.';
      case 'sierralite':
        return 'Sierra-Lite variant, fast error diffusion with minimal banding.';
      default:
        return 'Sierra error diffusion algorithm, high-quality dithering with reduced banding.';
    }
  };

  const info = getAlgorithmInfo();
  if (!info) {
    return null;
  }

  return (
    <div className="text-xs text-gray-600 dark:text-gray-400 p-2 bg-gray-100 dark:bg-gray-700 rounded-sm">
      <div className="flex items-center">
        <InfoIcon className="w-4 h-4 mr-2 shrink-0" />
        <div>{info}</div>
      </div>
    </div>
  );
};
