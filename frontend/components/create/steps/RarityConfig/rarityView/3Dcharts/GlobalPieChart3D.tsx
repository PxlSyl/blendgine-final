import React from 'react';

import { usePieChartData } from './hooks/usePieChartData';
import BasePieChart from './components/BasePieChart3D';

interface GlobalPieChartProps {
  selectedLayer: string;
}

const GlobalPieChart3D: React.FC<GlobalPieChartProps> = ({ selectedLayer }) => {
  const segments = usePieChartData(selectedLayer, '', true);
  return <BasePieChart segments={segments} />;
};

export default GlobalPieChart3D;
