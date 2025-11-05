import React, { useRef, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { PerspectiveCamera as ThreePerspectiveCamera } from 'three';

import { useRarity } from '@/components/store/rarityStore/hook';

import { BarChartIcon, PieChartIcon } from '@/components/icons/chartIcons';
import PieChart3D from './3Dcharts/PieChart3D';
import BarChart3D from './3Dcharts/BarChart3D';
import GlobalPieChart3D from './3Dcharts/GlobalPieChart3D';
import GlobalBarChart3D from './3Dcharts/GlobalBarChart3D';

const CameraAdjuster = () => {
  const { camera, size } = useThree();

  useEffect(() => {
    if (camera instanceof ThreePerspectiveCamera) {
      camera.aspect = size.width / size.height;
      camera.updateProjectionMatrix();
    }
  }, [size, camera]);

  return null;
};

interface RarityVisualizationProps {
  selectedLayer: string;
  activeSet: string;
}

const RarityVisualization: React.FC<RarityVisualizationProps> = ({ selectedLayer, activeSet }) => {
  const { chartViewMode, setChartViewMode, isGlobalViewActive } = useRarity();
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div className="flex flex-col">
      <div
        ref={containerRef}
        className={`relative w-full h-[600px] rounded-sm cursor-crosshair bg-white dark:bg-gray-800 shadow-lg`}
      >
        <div
          className={`absolute inset-0 bg-[size:20px_20px] bg-[linear-gradient(to_right,#E5E7EB_1px,transparent_1px),linear-gradient(to_bottom,#E5E7EB_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#374151_1px,transparent_1px),linear-gradient(to_bottom,#374151_1px,transparent_1px)]`}
        />
        <Canvas
          camera={{ position: [5, 5, 5], fov: 75 }}
          gl={{ antialias: true }}
          shadows
          style={{ width: '100%', height: '100%', position: 'absolute' }}
          resize={{ scroll: true }}
          dpr={window.devicePixelRatio}
        >
          <CameraAdjuster />
          <PerspectiveCamera makeDefault position={[5, 5, 5]} />
          <OrbitControls
            enableDamping
            dampingFactor={0.05}
            minDistance={3}
            maxDistance={chartViewMode === 'pie' ? 10 : 30}
          />
          {selectedLayer && !isGlobalViewActive && chartViewMode === 'pie' && (
            <PieChart3D selectedLayer={selectedLayer} activeSet={activeSet} />
          )}
          {selectedLayer && !isGlobalViewActive && chartViewMode === 'bar' && (
            <BarChart3D selectedLayer={selectedLayer} activeSet={activeSet} />
          )}
          {selectedLayer && isGlobalViewActive && chartViewMode === 'pie' && (
            <GlobalPieChart3D selectedLayer={selectedLayer} />
          )}
          {selectedLayer && isGlobalViewActive && chartViewMode === 'bar' && (
            <GlobalBarChart3D selectedLayer={selectedLayer} />
          )}
        </Canvas>

        <button
          onClick={() => setChartViewMode(chartViewMode === 'pie' ? 'bar' : 'pie')}
          className={`
            absolute bottom-4 right-4 px-4 py-2 rounded-md
            bg-white hover:bg-gray-100 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white
            shadow-lg
            flex items-center space-x-2
            border border-gray-200 dark:border-gray-600
            cursor-pointer
          `}
        >
          {chartViewMode === 'pie' ? (
            <>
              <BarChartIcon className="w-5 h-5" />
              <span>Bar Chart</span>
            </>
          ) : (
            <>
              <PieChartIcon className="w-5 h-5" />
              <span>Pie Chart</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default RarityVisualization;
