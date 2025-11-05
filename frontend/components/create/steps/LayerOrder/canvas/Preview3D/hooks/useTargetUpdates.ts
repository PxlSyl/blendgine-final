import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls } from 'three-stdlib';
import { useLayerOrder } from '@/components/store/layerOrder/hook';

interface UseTargetUpdatesProps {
  controlsRef: React.RefObject<OrbitControls | null>;
}

export const useTargetUpdates = ({ controlsRef }: UseTargetUpdatesProps) => {
  const { cameraType, setCurrentControls, perspectiveControls, orthographicControls } =
    useLayerOrder();
  const lastTargetUpdate = useRef(0);
  const TARGET_UPDATE_INTERVAL = 16; // ~60fps

  useFrame(() => {
    if (!controlsRef.current) {
      return;
    }

    const now = performance.now();
    if (now - lastTargetUpdate.current < TARGET_UPDATE_INTERVAL) {
      return;
    }

    const newTarget = controlsRef.current.target;
    const currentTarget =
      cameraType === 'perspective' ? perspectiveControls.target : orthographicControls.target;

    if (
      Math.abs(newTarget.x - currentTarget[0]) > 0.001 ||
      Math.abs(newTarget.y - currentTarget[1]) > 0.001 ||
      Math.abs(newTarget.z - currentTarget[2]) > 0.001
    ) {
      lastTargetUpdate.current = now;
      setCurrentControls({
        target: [newTarget.x, newTarget.y, newTarget.z],
      });
    }
  });

  const handleTargetChange = () => {
    if (!controlsRef.current) {
      return;
    }

    const now = performance.now();
    if (now - lastTargetUpdate.current < TARGET_UPDATE_INTERVAL) {
      return;
    }

    const newTarget = controlsRef.current.target;
    const currentTarget =
      cameraType === 'perspective' ? perspectiveControls.target : orthographicControls.target;

    if (
      Math.abs(newTarget.x - currentTarget[0]) > 0.001 ||
      Math.abs(newTarget.y - currentTarget[1]) > 0.001 ||
      Math.abs(newTarget.z - currentTarget[2]) > 0.001
    ) {
      lastTargetUpdate.current = now;
      setCurrentControls({
        target: [newTarget.x, newTarget.y, newTarget.z],
      });
    }
  };

  return { handleTargetChange };
};
