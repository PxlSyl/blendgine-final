import React from 'react';

import { useBarChartData } from './hooks/useChartData';
import BaseBarChart3D from './components/BaseBarChart3D';

interface BarChart3DProps {
  selectedLayer: string;
  activeSet: string;
}

const BarChart3D: React.FC<BarChart3DProps> = ({ selectedLayer, activeSet }) => {
  const bars = useBarChartData(selectedLayer, activeSet, false);
  return <BaseBarChart3D bars={bars} />;
};

export default BarChart3D;
