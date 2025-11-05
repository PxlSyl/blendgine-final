import React from 'react';

import { useBarChartData } from './hooks/useChartData';
import BaseBarChart3D from './components/BaseBarChart3D';

interface GlobalBarChart3DProps {
  selectedLayer: string;
}

const GlobalBarChart3D: React.FC<GlobalBarChart3DProps> = ({ selectedLayer }) => {
  const bars = useBarChartData(selectedLayer, '', true);
  return <BaseBarChart3D bars={bars} />;
};

export default GlobalBarChart3D;
