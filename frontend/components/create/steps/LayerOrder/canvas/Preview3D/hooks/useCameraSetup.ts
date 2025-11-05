import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three-stdlib';
import { useThree } from '@react-three/fiber';
import { useLayerOrder } from '@/components/store/layerOrder/hook';

export const useCameraSetup = () => {
  const { camera } = useThree();
  const { setCamera, cameraType, handleCameraRestore, setActiveControls } = useLayerOrder();
  const controlsRef = useRef<OrbitControls>(null);

  useEffect(() => {
    if (camera) {
      setCamera(camera);
    }
  }, [camera, setCamera]);

  useEffect(() => {
    if (camera && controlsRef.current) {
      const controls = controlsRef.current;
      setActiveControls(controls);

      if (camera instanceof THREE.OrthographicCamera) {
        camera.left = -5;
        camera.right = 5;
        camera.top = 5;
        camera.bottom = -5;
        camera.near = 0.1;
        camera.far = 100;

        if (camera.position.z > 15) {
          camera.position.z = 10;
        }
      }

      handleCameraRestore(
        camera as THREE.PerspectiveCamera | THREE.OrthographicCamera,
        controls,
        cameraType
      );
    }
  }, [camera, cameraType, handleCameraRestore, setActiveControls]);

  return { controlsRef };
};
