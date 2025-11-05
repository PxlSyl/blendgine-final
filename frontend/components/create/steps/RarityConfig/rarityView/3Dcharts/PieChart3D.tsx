import React from 'react';

import { usePieChartData } from './hooks/usePieChartData';
import BasePieChart from './components/BasePieChart3D';

interface PieChartProps {
  selectedLayer: string;
  activeSet: string;
}

const PieChart: React.FC<PieChartProps> = ({ selectedLayer, activeSet }) => {
  const segments = usePieChartData(selectedLayer, activeSet, false);
  return <BasePieChart segments={segments} />;
};

export default PieChart;
