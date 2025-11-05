import React, { useMemo } from 'react';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

import { PieSegmentData } from '../hooks/usePieChartData';

interface PieSegmentProps {
  startAngle: number;
  angle: number;
  color: string;
  radius?: number;
  height?: number;
}

interface SegmentLabelProps {
  position: [number, number, number];
  rotation: [number, number, number];
  trait: string;
  value: number;
  color: string;
}

const PieSegment: React.FC<PieSegmentProps> = ({
  startAngle,
  angle,
  color,
  radius = 2,
  height = 0.5,
}) => {
  const geometry = useMemo(() => {
    if (angle <= 0) {
      return null;
    }
    const geo = new THREE.CylinderGeometry(radius, radius, height, 32, 1, false, 0, angle);
    geo.rotateY(startAngle);
    return geo;
  }, [radius, height, startAngle, angle]);

  if (!geometry) {
    return null;
  }

  return (
    <mesh position={[0, 0, 0]}>
      <primitive object={geometry} />
      <meshPhongMaterial color={color} transparent={true} opacity={0.8} side={THREE.DoubleSide} />
    </mesh>
  );
};

const SegmentLabel: React.FC<SegmentLabelProps> = ({ position, rotation, trait, value, color }) => {
  return (
    <Html position={position} rotation={rotation} center>
      <div
        className="text-sm font-medium px-2 py-1 rounded-md shadow-lg"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          color,
          border: `1px solid ${color}`,
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
        }}
      >
        {trait}: {value.toFixed(2)}%
      </div>
    </Html>
  );
};

interface BasePieChartProps {
  segments: PieSegmentData[];
}

const BasePieChart: React.FC<BasePieChartProps> = ({ segments }) => {
  return (
    <>
      {segments.map((segment, index) => (
        <group key={`${segment.trait}-${index}`}>
          <PieSegment startAngle={segment.startAngle} angle={segment.angle} color={segment.color} />
          <line>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                count={2}
                array={new Float32Array([...segment.segmentPos, ...segment.labelPos])}
                itemSize={3}
                args={[new Float32Array([...segment.segmentPos, ...segment.labelPos]), 3]}
              />
            </bufferGeometry>
            <lineBasicMaterial color={segment.color} transparent opacity={0.6} />
          </line>
          <SegmentLabel
            position={segment.labelPos}
            rotation={segment.rotation}
            trait={segment.trait}
            value={segment.value}
            color={segment.color}
          />
        </group>
      ))}
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} />
    </>
  );
};

export default BasePieChart;
