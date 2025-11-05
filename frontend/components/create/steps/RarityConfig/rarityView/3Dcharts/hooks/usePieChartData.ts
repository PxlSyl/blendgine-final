import { useMemo } from 'react';

import { useLayerTraitsData } from './useLayerTraitsData';

export interface PieSegmentData {
  startAngle: number;
  angle: number;
  color: string;
  trait: string;
  value: number;
  segmentPos: [number, number, number];
  labelPos: [number, number, number];
  rotation: [number, number, number];
}

export const usePieChartData = (
  selectedLayer: string,
  activeSet: string,
  isGlobal: boolean = false
): PieSegmentData[] => {
  const traitsData = useLayerTraitsData(selectedLayer, activeSet, isGlobal);

  return useMemo(() => {
    if (!traitsData.length) {
      return [];
    }

    const total = traitsData.reduce((sum, trait) => sum + trait.value, 0);

    const sortedData = [...traitsData].sort((a, b) => b.value - a.value);

    const GAP = 0.02;
    const totalGapAngle = GAP * sortedData.length;
    const availableAngle = Math.PI * 2 - totalGapAngle;

    let currentAngle = -Math.PI / 2;

    return sortedData.map((item) => {
      const angle = (item.value / total) * availableAngle;
      const midAngle = currentAngle + angle / 2;

      const segmentPercentage = angle / (Math.PI * 2);
      const baseDistance = 3.2;
      const labelDistance = baseDistance + segmentPercentage * 0.8;

      const segmentPos: [number, number, number] = [
        Math.cos(midAngle) * 2.4,
        0,
        Math.sin(midAngle) * 2.4,
      ];

      const labelPos: [number, number, number] = [
        Math.cos(midAngle) * labelDistance,
        0,
        Math.sin(midAngle) * labelDistance,
      ];

      const rotation: [number, number, number] = [
        0,
        midAngle > Math.PI / 2 && midAngle < (3 * Math.PI) / 2
          ? -midAngle + Math.PI / 2
          : -midAngle - Math.PI / 2,
        0,
      ];

      const segment = {
        startAngle: -currentAngle + Math.PI / 3,
        angle,
        color: item.color,
        trait: item.trait,
        value: (item.value / total) * 100,
        segmentPos,
        labelPos,
        rotation,
      };

      currentAngle += angle + GAP;
      return segment;
    });
  }, [traitsData]);
};
