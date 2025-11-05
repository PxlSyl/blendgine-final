import { useEffect, useCallback, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from 'three-stdlib';
import { useLayerOrder } from '@/components/store/layerOrder/hook';

interface UseMeshUpdatesProps {
  meshesRef: React.RefObject<THREE.Mesh[]>;
  dimensions?: { width: number; height: number };
  controlsRef: React.RefObject<OrbitControls | null>;
  isMounted: React.RefObject<boolean>;
}

export const useMeshUpdates = ({
  meshesRef,
  dimensions,
  controlsRef,
  isMounted,
}: UseMeshUpdatesProps) => {
  const { camera } = useThree();
  const {
    updateDimensions,
    getCurrentParams,
    handleMeshUpdate,
    handleCameraSave,
    validateMeshes,
    cameraType,
    needsUpdate,
  } = useLayerOrder();

  const currentParams = getCurrentParams();
  const lastSaveTime = useRef(0);
  const lastUpdateTime = useRef(0);
  const lastDimensionsUpdate = useRef(0);
  const lastCameraUpdate = useRef(0);
  const frameSkipCount = useRef(0);

  const SAVE_INTERVAL = 500;
  const UPDATE_INTERVAL = 16;
  const DIMENSIONS_UPDATE_INTERVAL = 100;
  const CAMERA_UPDATE_INTERVAL = 100;
  const FRAME_SKIP = 2;

  useEffect(() => {
    if (!dimensions || !meshesRef.current.length) {
      return;
    }

    const now = Date.now();
    if (now - lastDimensionsUpdate.current < DIMENSIONS_UPDATE_INTERVAL) {
      return;
    }

    lastDimensionsUpdate.current = now;
    updateDimensions(meshesRef.current, dimensions, currentParams);
  }, [dimensions, currentParams.layerThickness, updateDimensions, meshesRef, currentParams]);

  const updateMeshScale = useCallback(() => {
    if (!dimensions || !meshesRef.current.length) {
      return;
    }

    const aspectRatio = dimensions.width / dimensions.height;
    meshesRef.current.forEach((mesh) => {
      if (mesh) {
        mesh.scale.x = aspectRatio;
        mesh.scale.y = 1;
      }
    });
  }, [dimensions, meshesRef]);

  useEffect(() => {
    updateMeshScale();
  }, [updateMeshScale, dimensions]);

  useFrame(() => {
    if (!isMounted.current || !validateMeshes(meshesRef.current)) {
      return;
    }

    const currentTime = Date.now();

    if (needsUpdate && currentTime - lastUpdateTime.current > UPDATE_INTERVAL) {
      handleMeshUpdate(meshesRef, currentParams);
      lastUpdateTime.current = currentTime;
    }

    if (currentTime - lastSaveTime.current > SAVE_INTERVAL && camera && controlsRef.current) {
      if (currentTime - lastCameraUpdate.current > CAMERA_UPDATE_INTERVAL) {
        handleCameraSave(
          camera as THREE.PerspectiveCamera | THREE.OrthographicCamera,
          controlsRef.current,
          cameraType
        );
        lastCameraUpdate.current = currentTime;
        lastSaveTime.current = currentTime;
      }
    }
  });

  useFrame(() => {
    if (!meshesRef.current.length || !isMounted.current) {
      return;
    }

    frameSkipCount.current++;
    if (frameSkipCount.current % FRAME_SKIP !== 0) {
      // Skip frame
    }
  });

  return { updateMeshScale };
};
