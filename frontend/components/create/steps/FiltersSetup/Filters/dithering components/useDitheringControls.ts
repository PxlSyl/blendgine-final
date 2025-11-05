import {
  FilterInstance,
  DitherAlgorithm,
  BayerOptions,
  SierraOptions,
  ClusteredDotOptions,
  HalftoneOptions,
} from '@/schemas/effect/filters/common';
import { FilterBlendMode } from '@/types/blendModes';
import { getDefaultFactors } from './utils';

interface UseDitheringControlsProps {
  filter: FilterInstance;
  updateFilter: (filterId: string, updates: Partial<FilterInstance>) => void;
}

export const useDitheringControls = ({ filter, updateFilter }: UseDitheringControlsProps) => {
  const handleAlgorithmChange = (algorithm: string) => {
    updateFilter(filter.id, { ditherAlgorithm: algorithm as DitherAlgorithm });

    if (filter.customFactors !== undefined) {
      const newFactors = getDefaultFactors(algorithm);
      updateFilter(filter.id, { customFactors: newFactors });
    }
  };

  const handleColorReductionChange = (value: number) => {
    updateFilter(filter.id, { colorReduction: Math.max(2, Math.min(255, value)) });
  };

  const handleDiffusionThresholdChange = (value: number) => {
    updateFilter(filter.id, { diffusionThreshold: Math.max(0, Math.min(255, value)) });
  };

  const handleBayerMatrixSizeChange = (size: number) => {
    const currentOptions = filter.bayerOptions ?? {};
    updateFilter(filter.id, {
      bayerOptions: {
        ...currentOptions,
        matrixSize: size as BayerOptions['matrixSize'],
      } as BayerOptions,
    });
  };

  const handleSierraVariantChange = (variant: string) => {
    const currentOptions = filter.sierraOptions ?? {};
    updateFilter(filter.id, {
      sierraOptions: {
        ...currentOptions,
        variant: variant as SierraOptions['variant'],
      },
    });

    if (filter.customFactors !== undefined) {
      const newFactors = getDefaultFactors(variant);
      updateFilter(filter.id, { customFactors: newFactors });
    }
  };

  const handleClusteredDotShapeChange = (shape: string) => {
    const currentOptions = filter.clusteredDotOptions ?? {};
    updateFilter(filter.id, {
      clusteredDotOptions: {
        ...currentOptions,
        shape: shape as ClusteredDotOptions['shape'],
        matrixSize: (currentOptions as ClusteredDotOptions).matrixSize ?? 8,
      },
    });
  };

  const handleHalftoneShapeChange = (shape: string) => {
    const currentOptions = filter.halftoneOptions ?? {};
    updateFilter(filter.id, {
      halftoneOptions: {
        ...currentOptions,
        shape: shape as HalftoneOptions['shape'],
        angle: (currentOptions as HalftoneOptions).angle ?? 45,
        frequency: (currentOptions as HalftoneOptions).frequency ?? 150,
        overlap: (currentOptions as HalftoneOptions).overlap ?? 0.1,
      },
    });
  };

  const handleHalftoneAngleChange = (angle: number) => {
    const currentOptions = filter.halftoneOptions ?? {};
    updateFilter(filter.id, {
      halftoneOptions: {
        ...currentOptions,
        angle: Math.max(0, Math.min(90, angle)),
        shape: (currentOptions as HalftoneOptions).shape ?? 'circle',
        frequency: (currentOptions as HalftoneOptions).frequency ?? 150,
        overlap: (currentOptions as HalftoneOptions).overlap ?? 0.1,
      },
    });
  };

  const handleHalftoneFrequencyChange = (frequency: number) => {
    const currentOptions = filter.halftoneOptions ?? {};
    updateFilter(filter.id, {
      halftoneOptions: {
        ...currentOptions,
        frequency: Math.max(10, Math.min(300, frequency)),
        angle: (currentOptions as HalftoneOptions).angle ?? 45,
        shape: (currentOptions as HalftoneOptions).shape ?? 'circle',
        overlap: (currentOptions as HalftoneOptions).overlap ?? 0.1,
      },
    });
  };

  const handleHalftoneOverlapChange = (overlap: number) => {
    const currentOptions = filter.halftoneOptions ?? {};
    updateFilter(filter.id, {
      halftoneOptions: {
        ...currentOptions,
        overlap: Math.max(0, Math.min(0.5, overlap)),
        angle: (currentOptions as HalftoneOptions).angle ?? 45,
        shape: (currentOptions as HalftoneOptions).shape ?? 'circle',
        frequency: (currentOptions as HalftoneOptions).frequency ?? 150,
      },
    });
  };

  const handleCustomFactorsChange = (factors: number[]) => {
    updateFilter(filter.id, {
      customFactors: factors,
    });
  };

  const handleBlendModeChange = (mode: FilterBlendMode) => {
    updateFilter(filter.id, { filterBlendMode: mode });
  };

  const handleIntensityChange = (intensity: number) => {
    updateFilter(filter.id, { intensity });
  };

  return {
    handleAlgorithmChange,
    handleColorReductionChange,
    handleDiffusionThresholdChange,
    handleBayerMatrixSizeChange,
    handleSierraVariantChange,
    handleClusteredDotShapeChange,
    handleHalftoneShapeChange,
    handleHalftoneAngleChange,
    handleHalftoneFrequencyChange,
    handleHalftoneOverlapChange,
    handleCustomFactorsChange,
    handleBlendModeChange,
    handleIntensityChange,
  };
};
