import { StateCreator } from 'zustand';
import * as THREE from 'three';
import { OrbitControls } from 'three-stdlib';
import { animate } from 'framer-motion';

import type { Preview3DState, OrbitControlsParams } from '../types';

type CameraSliceState = Pick<
  Preview3DState,
  | 'cameraType'
  | 'perspectiveCameraState'
  | 'orthographicCameraState'
  | 'perspectiveParams'
  | 'orthographicParams'
  | 'perspectiveControls'
  | 'orthographicControls'
  | 'camera'
  | 'activeControls'
  | 'meshes'
  | 'setPerspectiveCameraState'
  | 'setOrthographicCameraState'
  | 'updateCamera'
>;

export interface CameraSlice {
  setCamera: (camera: THREE.PerspectiveCamera | THREE.OrthographicCamera) => void;
  setActiveControls: (controls: OrbitControls) => void;
  handleCameraSave: (
    camera: THREE.PerspectiveCamera | THREE.OrthographicCamera,
    controls: OrbitControls,
    cameraType: 'perspective' | 'orthographic'
  ) => void;
  handleCameraRestore: (
    camera: THREE.PerspectiveCamera | THREE.OrthographicCamera,
    controls: OrbitControls,
    cameraType: 'perspective' | 'orthographic'
  ) => void;
  setZoom: (
    value: number,
    cameraType: 'perspective' | 'orthographic',
    shouldAnimate?: boolean
  ) => void;
  resetToFlatView: () => void;
  setCurrentControls: (params: Partial<OrbitControlsParams>) => void;
}

export const createCameraSlice: StateCreator<CameraSliceState, [], [], CameraSlice> = (
  set,
  get
) => ({
  activeControls: undefined,
  setCamera: (camera) => {
    set({ camera });
  },

  setActiveControls: (controls: OrbitControls) => {
    set({ activeControls: controls });
  },

  handleCameraSave: (camera, controls, cameraType) => {
    const newCameraState = {
      position: camera.position.clone(),
      rotation: camera.rotation.clone(),
      target: controls.target.clone(),
      zoom: camera instanceof THREE.OrthographicCamera ? camera.zoom : 1,
    };

    if (cameraType === 'perspective') {
      get().setPerspectiveCameraState(newCameraState);
    } else {
      get().setOrthographicCameraState(newCameraState);
    }
  },

  handleCameraRestore: (camera, controls, cameraType) => {
    const state = get();
    const currentState =
      cameraType === 'perspective' ? state.perspectiveCameraState : state.orthographicCameraState;

    if (currentState.position) {
      camera.position.copy(currentState.position);
      if (currentState.rotation) {
        camera.rotation.copy(currentState.rotation);
      }
      if (currentState.target) {
        controls.target.copy(currentState.target);
      }

      if (camera instanceof THREE.OrthographicCamera) {
        camera.zoom = currentState.zoom;
        const frustumSize = 25;
        camera.left = -frustumSize;
        camera.right = frustumSize;
        camera.top = frustumSize;
        camera.bottom = -frustumSize;
      } else if (camera instanceof THREE.PerspectiveCamera) {
        camera.zoom = currentState.zoom;
      }

      const currentZoom = currentState.zoom || 1;
      const newMinDistance = Math.max(2, 10 / currentZoom);
      const newMaxDistance = Math.min(200, 100 / currentZoom);

      if (newMinDistance < newMaxDistance) {
        controls.minDistance = newMinDistance;
        controls.maxDistance = newMaxDistance;
      }

      camera.updateProjectionMatrix();
    }
  },

  setZoom: (value: number, cameraType: 'perspective' | 'orthographic') => {
    const { camera, activeControls } = get();
    if (!camera || !activeControls) {
      return;
    }

    const clampedValue = Math.max(0.5, Math.min(9, value));
    if (Math.abs(clampedValue - value) > 0.001) {
      value = clampedValue;
    }

    const currentParams =
      cameraType === 'perspective' ? get().perspectiveParams : get().orthographicParams;
    if (Math.abs(value - currentParams.zoom) < 0.001) {
      return;
    }

    if (cameraType === 'perspective') {
      set({ perspectiveParams: { ...get().perspectiveParams, zoom: value } });
    } else {
      set({ orthographicParams: { ...get().orthographicParams, zoom: value } });
    }

    if (camera instanceof THREE.OrthographicCamera) {
      camera.zoom = value;
      camera.updateProjectionMatrix();
    } else if (camera instanceof THREE.PerspectiveCamera) {
      const currentPosition = camera.position.clone();
      const direction = currentPosition.normalize();
      const distance = 30 / value;
      camera.position.copy(direction.multiplyScalar(distance));
    }

    const newMinDistance = Math.max(2, 10 / value);
    const newMaxDistance = Math.min(200, 100 / value);

    const currentDistance = camera.position.distanceTo(activeControls.target);
    const shouldUpdateLimits =
      Math.abs(activeControls.minDistance - newMinDistance) > 0.1 ||
      Math.abs(activeControls.maxDistance - newMaxDistance) > 0.1;

    if (shouldUpdateLimits) {
      const willBeClamped = currentDistance < newMinDistance || currentDistance > newMaxDistance;

      if (!willBeClamped) {
        activeControls.minDistance = newMinDistance;
        activeControls.maxDistance = newMaxDistance;
      }
    }
  },

  updateCamera: () => {
    const { camera, cameraType, activeControls } = get();
    if (!camera || !activeControls) {
      return;
    }

    const params =
      cameraType === 'perspective' ? get().perspectiveParams : get().orthographicParams;

    if (cameraType === 'perspective' && camera instanceof THREE.PerspectiveCamera) {
      const currentPosition = camera.position.clone();
      const direction = currentPosition.normalize();
      const distance = 30 / params.zoom;

      const newPosition = direction.multiplyScalar(distance);
      if (currentPosition.distanceTo(newPosition) > 0.01) {
        camera.position.copy(newPosition);
      }
    } else if (camera instanceof THREE.OrthographicCamera) {
      if (Math.abs(camera.zoom - params.zoom) > 0.001) {
        camera.zoom = params.zoom;
        camera.updateProjectionMatrix();
      }
    }

    const newMinDistance = Math.max(2, 10 / params.zoom);
    const newMaxDistance = Math.min(200, 100 / params.zoom);

    const currentDistance = camera.position.distanceTo(activeControls.target);
    const shouldUpdateLimits =
      Math.abs(activeControls.minDistance - newMinDistance) > 0.1 ||
      Math.abs(activeControls.maxDistance - newMaxDistance) > 0.1;

    if (shouldUpdateLimits) {
      const willBeClamped = currentDistance < newMinDistance || currentDistance > newMaxDistance;

      if (!willBeClamped) {
        activeControls.minDistance = newMinDistance;
        activeControls.maxDistance = newMaxDistance;
      }
    }
  },

  resetToFlatView: () => {
    const { cameraType, meshes, camera, activeControls } = get();
    if (!meshes.length || !camera || !activeControls) {
      return;
    }

    const currentParams =
      cameraType === 'perspective' ? get().perspectiveParams : get().orthographicParams;

    const startPosition = camera.position.clone();
    const startRotation = camera.rotation.clone();
    const startTarget = activeControls.target.clone();

    const endPosition = new THREE.Vector3(0, 0, cameraType === 'perspective' ? 15 : 30);
    const endRotation = new THREE.Euler(0, 0, 0);
    const endTarget = new THREE.Vector3(0, 0, 0);

    const animationState = {
      progress: 0,
      spacing: currentParams.layerSpacing,
      thickness: currentParams.layerThickness,
      lastUpdateTime: 0,
      updateInterval: 1000 / 60,
    };

    const duration = 2;
    const ease = [0.2, 0, 0, 1] as const;

    const updateCamera = (progress: number) => {
      const newPosition = new THREE.Vector3().lerpVectors(startPosition, endPosition, progress);
      const newRotation = new THREE.Euler(
        startRotation.x + (endRotation.x - startRotation.x) * progress,
        startRotation.y + (endRotation.y - startRotation.y) * progress,
        startRotation.z + (endRotation.z - startRotation.z) * progress
      );
      const newTarget = new THREE.Vector3().lerpVectors(startTarget, endTarget, progress);

      camera.position.copy(newPosition);
      camera.rotation.copy(newRotation);
      activeControls.target.copy(newTarget);

      camera.updateProjectionMatrix();
      activeControls.update();
    };

    const updateMeshes = (progress: number) => {
      meshes.forEach((mesh, index) => {
        if (mesh) {
          const newGeometry = new THREE.BoxGeometry(
            mesh.userData.width,
            mesh.userData.height,
            animationState.thickness
          );
          mesh.geometry.dispose();
          mesh.geometry = newGeometry;

          const targetZ = index * (animationState.spacing + animationState.thickness);
          const currentZ = mesh.position.z;
          const newZ = currentZ + (targetZ - currentZ) * progress;
          mesh.position.z = newZ;

          mesh.updateMatrix();
          mesh.updateMatrixWorld(true);
        }
      });
    };

    const updateState = () => {
      const now = performance.now();
      if (now - animationState.lastUpdateTime < animationState.updateInterval) {
        return;
      }
      animationState.lastUpdateTime = now;

      set((state) => ({
        perspectiveParams: {
          ...state.perspectiveParams,
          layerSpacing: animationState.spacing,
          layerThickness: animationState.thickness,
        },
        orthographicParams: {
          ...state.orthographicParams,
          layerSpacing: animationState.spacing,
          layerThickness: animationState.thickness,
        },
        [cameraType === 'perspective' ? 'perspectiveCameraState' : 'orthographicCameraState']: {
          ...state[
            cameraType === 'perspective' ? 'perspectiveCameraState' : 'orthographicCameraState'
          ],
          position: camera.position.clone(),
          rotation: camera.rotation.clone(),
          target: activeControls.target.clone(),
        },
      }));
    };

    void animate(0, 1, {
      duration: duration * 0.6,
      ease,
      onUpdate: (progress) => {
        updateCamera(progress);
        requestAnimationFrame(() => updateState());
      },
    }).then(() => {
      setTimeout(() => {
        void animate(0, 1, {
          duration: duration * 0.4,
          ease,
          onUpdate: (progress) => {
            animationState.progress = progress;
            animationState.spacing = currentParams.layerSpacing * (1 - progress) + 0.001 * progress;
            animationState.thickness =
              currentParams.layerThickness * (1 - progress) + 0.001 * progress;
            updateMeshes(progress);
            requestAnimationFrame(() => updateState());
          },
        }).then(() => {
          updateCamera(1);
          updateMeshes(1);
          updateState();
        });
      }, 200);
    });
  },

  setCurrentControls: (params: Partial<OrbitControlsParams>) => {
    const state = get();
    const currentControls =
      state.cameraType === 'perspective' ? state.perspectiveControls : state.orthographicControls;

    const hasChanges = Object.entries(params).some(([key, value]) => {
      if (key === 'target' && Array.isArray(value)) {
        return (
          Math.abs(value[0] - currentControls.target[0]) > 0.001 ||
          Math.abs(value[1] - currentControls.target[1]) > 0.001 ||
          Math.abs(value[2] - currentControls.target[2]) > 0.001
        );
      }
      return currentControls[key as keyof OrbitControlsParams] !== value;
    });

    if (!hasChanges) {
      return;
    }

    if (state.cameraType === 'perspective') {
      set({
        perspectiveControls: {
          ...state.perspectiveControls,
          ...params,
        },
      });
    } else {
      set({
        orthographicControls: {
          ...state.orthographicControls,
          ...params,
        },
      });
    }
  },
});
