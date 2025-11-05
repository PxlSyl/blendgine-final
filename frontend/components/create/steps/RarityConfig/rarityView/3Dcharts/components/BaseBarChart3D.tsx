import React, { useMemo } from 'react';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

import { BarData } from '../hooks/useChartData';

export interface BarProps {
  position: [number, number, number];
  height: number;
  color: string;
  trait: string;
  value: number;
}

const Bar: React.FC<BarProps> = ({ position, height, color, trait, value }) => {
  const geometry = useMemo(() => {
    return new THREE.BoxGeometry(0.8, height, 0.8);
  }, [height]);

  return (
    <group position={position}>
      <mesh geometry={geometry}>
        <meshPhongMaterial color={color} transparent opacity={0.8} />
      </mesh>
      <Html position={[0, height + 0.5, 0]} center>
        <div
          className="text-sm font-medium px-2 py-1 rounded-md shadow-lg whitespace-nowrap"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            color,
            border: `1px solid ${color}`,
            pointerEvents: 'none',
            transform: 'scale(0.8)',
          }}
        >
          {trait}: {value.toFixed(2)}%
        </div>
      </Html>
    </group>
  );
};

interface BaseBarChart3DProps {
  bars: BarData[];
}

const BaseBarChart3D: React.FC<BaseBarChart3DProps> = ({ bars }) => {
  return (
    <group position={[0, 0, 0]}>
      {bars.map((bar) => (
        <Bar
          key={bar.trait}
          position={bar.position}
          height={bar.height}
          color={bar.color}
          trait={bar.trait}
          value={bar.value}
        />
      ))}

      <gridHelper args={[20, 20, '#666666', '#444444']} position={[0, 0, 0]} rotation={[0, 0, 0]} />

      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} />
      <directionalLight position={[-5, 5, -5]} intensity={0.3} />

      <group position={[0, -0.01, 0]}>
        {bars.map((bar) => (
          <mesh
            key={`shadow-${bar.trait}`}
            position={[bar.position[0], 0, bar.position[2]]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <planeGeometry args={[1, 1]} />
            <meshBasicMaterial
              color={bar.color}
              transparent
              opacity={0.1}
              side={THREE.DoubleSide}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
};

export default BaseBarChart3D;
