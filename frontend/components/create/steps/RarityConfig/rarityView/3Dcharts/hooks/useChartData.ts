import { useMemo } from 'react';

import { useLayerTraitsData } from './useLayerTraitsData';

export interface BarData {
  trait: string;
  value: number;
  color: string;
  height: number;
  position: [number, number, number];
}

export const useBarChartData = (
  selectedLayer: string,
  activeSet: string,
  isGlobal: boolean = false
): BarData[] => {
  const traitsData = useLayerTraitsData(selectedLayer, activeSet, isGlobal);

  return useMemo(() => {
    if (!traitsData.length) {
      return [];
    }

    const totalValue = traitsData.reduce((sum, trait) => sum + trait.value, 0);

    const dataWithPercentages = traitsData.map((trait) => ({
      ...trait,
      percentage: (trait.value / totalValue) * 100,
    }));

    const sortedData = [...dataWithPercentages].sort((a, b) => b.value - a.value);

    const maxPercentage = Math.max(...sortedData.map((t) => t.percentage));
    const maxHeight = 4;
    const spacing = 1.2;

    return sortedData.map((traitData, index) => {
      const height = (traitData.percentage / maxPercentage) * maxHeight;
      const offset = ((sortedData.length - 1) * spacing) / 2;
      const xPosition = index * spacing - offset;

      return {
        trait: traitData.trait,
        value: traitData.percentage,
        color: traitData.color,
        height,
        position: [xPosition, height / 2, 0] as [number, number, number],
      };
    });
  }, [traitsData]);
};
