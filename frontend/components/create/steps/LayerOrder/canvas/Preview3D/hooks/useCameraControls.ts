import { useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three-stdlib';
import { useLayerOrder } from '@/components/store/layerOrder/hook';

interface UseCameraControlsProps {
  controlsRef: React.RefObject<OrbitControls | null>;
}

export const useCameraControls = ({ controlsRef }: UseCameraControlsProps) => {
  const { cameraType, getCurrentControls, perspectiveParams, orthographicParams, setZoom } =
    useLayerOrder();

  useEffect(() => {
    if (!controlsRef.current) {
      return;
    }

    const controls = controlsRef.current;
    let lastUpdateTime = 0;
    const UPDATE_INTERVAL = 16;

    const handleZoomChange = () => {
      const now = performance.now();
      if (now - lastUpdateTime < UPDATE_INTERVAL) {
        return;
      }
      lastUpdateTime = now;

      let newZoom;

      if (cameraType === 'perspective') {
        const distance = controls.object.position.distanceTo(controls.target);
        newZoom = 30 / distance;
      } else {
        const orthoCamera = controls.object as THREE.OrthographicCamera;
        newZoom = Math.max(0.5, Math.min(9, orthoCamera.zoom));
        if (controls.object instanceof THREE.OrthographicCamera) {
          const camera = controls.object;
          Object.assign(camera, { zoom: newZoom } as Record<string, unknown>);
          camera.updateProjectionMatrix();
        }
      }

      const currentParams = cameraType === 'perspective' ? perspectiveParams : orthographicParams;

      if (Math.abs(newZoom - currentParams.zoom) > 0.001) {
        setZoom(newZoom, cameraType);
      }
    };

    controls.addEventListener('change', handleZoomChange);
    return () => controls.removeEventListener('change', handleZoomChange);
  }, [cameraType, perspectiveParams, orthographicParams, setZoom, controlsRef]);

  useEffect(() => {
    if (!controlsRef.current) {
      return;
    }

    const controls = controlsRef.current;

    if (cameraType === 'perspective') {
      controls.minDistance = 30 / 9;
      controls.maxDistance = 30 / 0.5;
    } else {
      controls.minDistance = 0.5;
      controls.maxDistance = 9;
    }

    controls.update();
  }, [cameraType, controlsRef]);

  return { currentControls: getCurrentControls() };
};
