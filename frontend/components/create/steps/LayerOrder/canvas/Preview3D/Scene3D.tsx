import React from 'react';
import * as THREE from 'three';
import { OrbitControls } from '@react-three/drei';

import { useLayerOrder } from '@/components/store/layerOrder/hook';

import {
  useCameraSetup,
  useOrthographicCamera,
  useCameraControls,
  useMeshAnimation,
  useMeshManagement,
  useMeshUpdates,
  useTargetUpdates,
} from './hooks';

interface Scene3DProps {
  meshesRef: React.RefObject<THREE.Mesh[]>;
  layers: string[];
  currentTraits: Record<string, string>;
}

const Scene3D: React.FC<Scene3DProps> = ({ meshesRef, layers, currentTraits }) => {
  const { lightingParams, generationId, dimensions } = useLayerOrder();

  const { controlsRef } = useCameraSetup();
  const { isMounted } = useMeshAnimation({ meshesRef });
  const { handleTargetChange } = useTargetUpdates({ controlsRef });

  useOrthographicCamera({ meshesRef, dimensions });
  useCameraControls({ controlsRef });
  useMeshManagement({ meshesRef, layers, currentTraits, generationId });
  useMeshUpdates({ meshesRef, dimensions, controlsRef, isMounted });

  return (
    <>
      <OrbitControls ref={controlsRef} onChange={handleTargetChange} />
      {}
      <ambientLight intensity={lightingParams.ambient.intensity} />
      <directionalLight
        position={lightingParams.directional.position}
        intensity={lightingParams.directional.intensity}
      />
      {}
    </>
  );
};

export default React.memo(Scene3D);
