import { StateCreator } from 'zustand';
import * as THREE from 'three';
import { animate, easeOut } from 'framer-motion';

import type { ViewParams, Preview3DState } from '../types';
import type { PreviewImage } from '@/types/preview';

import { setupTexture } from './utils';

import { useProjectSetupStore } from '@/components/store/projectSetup/main';
import { useLayerOrderStore } from '@/components/store/layerOrder/main';

type MeshSliceState = Pick<
  Preview3DState,
  | 'meshes'
  | 'cameraType'
  | 'perspectiveParams'
  | 'orthographicParams'
  | 'geometryParams'
  | 'setMeshes'
  | 'setPerspectiveParams'
  | 'setOrthographicParams'
  | 'setGeometryParams'
  | 'framesByLayer'
  | 'getCurrentParams'
  | 'createMesh'
  | 'meshCache'
  | 'cleanupMesh'
  | 'updateDimensions'
> & {
  dimensions?: { width: number; height: number };
  needsUpdate?: boolean;
};

export interface MeshSlice {
  dimensions: { width: number; height: number } | undefined;
  setLayerSpacing: (spacing: number, viewType: 'perspective' | 'orthographic') => void;
  setLayerThickness: (thickness: number, viewType: 'perspective' | 'orthographic') => void;
  updateMeshPositions: () => void;
  updateMeshDimensions: (mesh: THREE.Mesh, width: number, height: number) => void;
  createMesh: (params: {
    image: PreviewImage;
    layerName: string;
    traitName: string;
    layerSpacing: number;
    layerThickness: number;
    meshIndex: number;
  }) => Promise<THREE.Mesh>;
  updateMeshTextures: (meshes: THREE.Mesh[], images: PreviewImage[]) => Promise<void>;
  cleanupMesh: (mesh: THREE.Mesh) => void;
  handleMeshUpdate: (meshesRef: React.RefObject<THREE.Mesh[]>, currentParams: ViewParams) => void;
  cleanupMeshesFromScene: (meshesRef: React.RefObject<THREE.Mesh[]>, scene: THREE.Scene) => void;
  validateMeshes: (meshes: THREE.Mesh[]) => boolean;
  updateDimensions: (
    meshes: THREE.Mesh[],
    dimensions: { width: number; height: number },
    currentParams: ViewParams
  ) => void;
  setDimensions: (dimensions: { width: number; height: number }) => void;
  setGeometryParams: (params: Partial<Preview3DState['geometryParams']>) => void;
  setMeshes: (meshes: THREE.Mesh[]) => void;
}

export const createMeshSlice: StateCreator<MeshSliceState, [], [], MeshSlice> = (set, get) => ({
  dimensions: undefined,

  setLayerSpacing: (spacing: number, viewType: 'perspective' | 'orthographic') => {
    const state = get();
    const currentParams =
      viewType === 'perspective' ? state.perspectiveParams : state.orthographicParams;
    const { meshes } = state;
    if (!meshes.length) {
      return;
    }

    set((state) => ({
      perspectiveParams: {
        ...state.perspectiveParams,
        layerSpacing: spacing,
      },
      orthographicParams: {
        ...state.orthographicParams,
        layerSpacing: spacing,
      },
    }));

    const totalSpacing = spacing + currentParams.layerThickness;
    meshes.forEach((mesh, index) => {
      if (mesh?.position) {
        const currentZ = mesh.position.z;
        const targetZ = index * totalSpacing;

        animate(currentZ, targetZ, {
          duration: 0.3,
          ease: easeOut,
          onUpdate: (latest) => {
            mesh.position.z = latest;
            mesh.updateMatrix();
            mesh.updateMatrixWorld(true);
          },
        });
      }
    });
  },

  setLayerThickness: (thickness: number, viewType: 'perspective' | 'orthographic') => {
    const state = get();
    const currentParams =
      viewType === 'perspective' ? state.perspectiveParams : state.orthographicParams;
    const { meshes } = state;
    if (!meshes.length) {
      return;
    }

    set((state) => ({
      perspectiveParams: {
        ...state.perspectiveParams,
        layerThickness: thickness,
      },
      orthographicParams: {
        ...state.orthographicParams,
        layerThickness: thickness,
      },
    }));

    const totalSpacing = currentParams.layerSpacing + thickness;
    meshes.forEach((mesh, index) => {
      if (mesh) {
        const currentThickness = (mesh.geometry as THREE.BoxGeometry).parameters.depth;
        animate(currentThickness, thickness, {
          duration: 0.3,
          ease: easeOut,
          onUpdate: (latest) => {
            const newGeometry = new THREE.BoxGeometry(
              mesh.userData.width,
              mesh.userData.height,
              latest
            );
            mesh.geometry.dispose();
            mesh.geometry = newGeometry;
          },
        });

        const currentZ = mesh.position.z;
        const targetZ = index * totalSpacing;

        animate(currentZ, targetZ, {
          duration: 0.3,
          ease: easeOut,
          onUpdate: (latest) => {
            mesh.position.z = latest;
            mesh.updateMatrix();
            mesh.updateMatrixWorld(true);
          },
        });
      }
    });
  },

  updateMeshPositions: () => {
    const { meshes, cameraType, perspectiveParams, orthographicParams } = get();
    if (!meshes.length) {
      return;
    }

    const currentParams = cameraType === 'perspective' ? perspectiveParams : orthographicParams;
    const spacing = currentParams.layerSpacing + currentParams.layerThickness;

    const layerOrderStore = useLayerOrderStore.getState();
    const { activeSetId } = layerOrderStore;
    const currentSetId = activeSetId ?? 'set1';
    const orderedLayers = layerOrderStore.sets[currentSetId]?.layers ?? [];

    const zIndexMap = {};
    orderedLayers.forEach((layerName, index) => {
      zIndexMap[layerName] = index;
    });

    meshes.forEach((mesh) => {
      if (mesh?.userData?.layerName) {
        mesh.userData.zIndex = (zIndexMap[mesh.userData.layerName as string] as number) ?? 0;
      }
    });

    const orderedMeshes = [...meshes].sort(
      (a, b) => (a.userData.zIndex ?? 0) - (b.userData.zIndex ?? 0)
    );
    set({ meshes: orderedMeshes });

    orderedMeshes.forEach((mesh, index) => {
      if (mesh?.position) {
        const newZ = index * spacing;
        if (mesh.position.z !== newZ) {
          mesh.position.z = newZ;
          mesh.updateMatrix();
          mesh.updateMatrixWorld(true);
        }
      }
    });
  },

  updateMeshDimensions: (mesh: THREE.Mesh, width: number, height: number) => {
    if (!mesh) {
      return;
    }

    const currentThickness = (mesh.geometry as THREE.BoxGeometry).parameters.depth;
    const newGeometry = new THREE.BoxGeometry(width, height, currentThickness);

    mesh.geometry.dispose();
    mesh.geometry = newGeometry;

    mesh.userData.width = width;
    mesh.userData.height = height;

    mesh.updateMatrix();
    mesh.updateMatrixWorld(true);
  },

  createMesh: async (params) => {
    await Promise.resolve();
    const { image, layerName, traitName, layerSpacing, layerThickness, meshIndex } = params;

    let opacity = 1;
    const layerOrderState = useLayerOrderStore.getState();
    const { activeSetId } = layerOrderState;
    const currentSetId = activeSetId ?? 'set1';
    const layerConfig = layerOrderState.rarityConfig[layerName];
    if (!layerConfig?.traits) {
      opacity = 1;
    } else {
      const traitConfig = layerConfig.traits[traitName];
      const sets = traitConfig?.sets;
      opacity = sets ? (sets[currentSetId]?.blend?.opacity ?? 1) : 1;
    }

    const texture = setupTexture(image.element);
    texture.format = THREE.RGBAFormat;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;

    const { spritesheetLayout } = useProjectSetupStore.getState();

    let width = 5;
    let height = 5;

    if (spritesheetLayout) {
      const { frameWidth, frameHeight } = spritesheetLayout;

      if (frameWidth && frameHeight && frameWidth > 0 && frameHeight > 0) {
        const aspectRatio = frameWidth / frameHeight;
        const baseSize = 5;
        width = aspectRatio > 1 ? baseSize * aspectRatio : baseSize;
        height = aspectRatio > 1 ? baseSize : baseSize / aspectRatio;
      }
    } else if (image.element) {
      const aspectRatio = image.element.width / image.element.height;
      const baseSize = 5;
      width = aspectRatio > 1 ? baseSize * aspectRatio : baseSize;
      height = aspectRatio > 1 ? baseSize : baseSize / aspectRatio;
    }

    width = Number.isFinite(width) ? width : 5;
    height = Number.isFinite(height) ? height : 5;

    const material = new THREE.MeshStandardMaterial({
      map: texture,
      transparent: true,
      opacity,
      side: THREE.FrontSide,
      depthWrite: true,
      depthTest: true,
      roughness: 0.4,
      metalness: 0.0,
      envMapIntensity: 0.5,
      alphaTest: 0.01,
    });

    if (spritesheetLayout && material.map) {
      material.map.repeat.set(1 / spritesheetLayout.cols, 1 / spritesheetLayout.rows);
      material.map.offset.set(0, 1 - 1 / spritesheetLayout.rows);
      material.map.wrapS = THREE.RepeatWrapping;
      material.map.wrapT = THREE.RepeatWrapping;
      material.map.minFilter = THREE.NearestFilter;
      material.map.magFilter = THREE.NearestFilter;
      material.map.needsUpdate = true;
    }

    const geometry = new THREE.BoxGeometry(width, height, layerThickness);
    const mesh = new THREE.Mesh(geometry, material);

    mesh.rotation.set(0, Math.PI, 0);
    mesh.position.set(0, 0, meshIndex * (layerSpacing + layerThickness));

    mesh.userData = {
      width,
      height,
      layerName,
      traitName,
      layerTraitKey: `${layerName}-${traitName}`,
      aspectRatio: width / height,
      originalOpacity: image.opacity ?? 1,
      currentSpacing: layerSpacing,
      currentThickness: layerThickness,
      currentFrame: 0,
      currentSheetIndex: 0,
      totalFrames: 0,
    };

    return mesh;
  },

  updateMeshTextures: async (meshes, images) => {
    const layerOrderState = useLayerOrderStore.getState();
    const { activeSetId } = layerOrderState;
    const currentSetId = activeSetId ?? 'set1';

    const updatedMeshesPromises = images.map(async (img, index) => {
      const existingMesh = meshes[index];
      const currentParams = get().getCurrentParams();

      if (existingMesh) {
        const material = existingMesh.material as THREE.MeshStandardMaterial;

        const layerConfig = layerOrderState.rarityConfig[img.layerName];
        if (!layerConfig?.traits) {
          material.opacity = 1;
        } else {
          const traitConfig = layerConfig.traits[img.traitName];
          const sets = traitConfig?.sets;
          material.opacity = sets ? (sets[currentSetId]?.blend?.opacity ?? 1) : 1;
        }

        const spritesheets = get().framesByLayer[img.layerName]?.[img.traitName];
        const firstSpritesheet = spritesheets?.[0];

        if (firstSpritesheet) {
          if (material.map) {
            material.map.dispose();
          }
          material.map = firstSpritesheet.texture;
          material.map.wrapS = THREE.RepeatWrapping;
          material.map.wrapT = THREE.RepeatWrapping;
          material.map.repeat.x = 1 / firstSpritesheet.layout.cols;
          material.map.repeat.y = 1 / firstSpritesheet.layout.rows;
        } else {
          const texture = setupTexture(img.element);
          if (material.map) {
            material.map.dispose();
          }
          material.map = texture;
        }
        material.needsUpdate = true;

        const layerConfig2 = layerOrderState.rarityConfig[img.layerName];
        let zIndex = 0;
        if (layerConfig2?.traits) {
          const traitConfig = layerConfig2.traits[img.traitName];
          if (traitConfig?.sets) {
            zIndex = traitConfig.sets[currentSetId]?.zIndex;

            zIndex ??= traitConfig.sets['default']?.zIndex;
          }
        }

        existingMesh.userData.zIndex = Number(zIndex) || 0;
        existingMesh.userData.currentSheetIndex = 0;
        return existingMesh;
      } else {
        const newMesh = await get().createMesh({
          image: img,
          layerName: img.layerName,
          traitName: img.traitName,
          layerSpacing: currentParams.layerSpacing,
          layerThickness: currentParams.layerThickness,
          meshIndex: index,
        });

        const layerConfig2 = layerOrderState.rarityConfig[img.layerName];
        let zIndex = 0;
        if (layerConfig2?.traits) {
          const traitConfig = layerConfig2.traits[img.traitName];
          if (traitConfig?.sets) {
            zIndex = traitConfig.sets[currentSetId]?.zIndex;

            zIndex ??= traitConfig.sets['default']?.zIndex;
          }
        }

        newMesh.userData.zIndex = Number(zIndex) || 0;
        return newMesh;
      }
    });

    const updatedMeshes = await Promise.all(updatedMeshesPromises);
    const orderedMeshes = [...updatedMeshes].sort(
      (a, b) => (a.userData.zIndex ?? 0) - (b.userData.zIndex ?? 0)
    );

    set((state) => ({
      meshes: orderedMeshes,
      meshCache: {
        ...state.meshCache,
        [currentSetId]: orderedMeshes,
      },
    }));

    const currentParams = get().getCurrentParams();
    orderedMeshes.forEach((mesh) => {
      if (mesh.userData.currentThickness !== currentParams.layerThickness) {
        const newGeometry = new THREE.BoxGeometry(
          mesh.userData.width,
          mesh.userData.height,
          currentParams.layerThickness
        );
        mesh.geometry.dispose();
        mesh.geometry = newGeometry;
        mesh.userData.currentThickness = currentParams.layerThickness;
      }

      const zIndex = (mesh.userData.zIndex as number) ?? 0;
      const newZ = zIndex * (currentParams.layerSpacing + currentParams.layerThickness);
      if (mesh.position.z !== newZ) {
        mesh.position.z = newZ;
        mesh.userData.currentSpacing = currentParams.layerSpacing;
      }

      mesh.updateMatrix();
      mesh.updateMatrixWorld(true);
    });
  },

  cleanupMesh: (mesh) => {
    try {
      if (mesh.material instanceof THREE.MeshStandardMaterial) {
        if (mesh.material.map) {
          mesh.material.map.dispose();
        }
        mesh.material.dispose();
      } else if (Array.isArray(mesh.material)) {
        mesh.material.forEach((mat) => {
          if (mat instanceof THREE.MeshStandardMaterial && mat.map) {
            mat.map.dispose();
          }
          mat.dispose();
        });
      } else if (mesh.material instanceof THREE.Material) {
        mesh.material.dispose();
      }

      if (mesh.geometry) {
        mesh.geometry.dispose();
      }

      mesh.userData = {};

      if (mesh.parent) {
        mesh.parent.remove(mesh);
      }
    } catch (error) {
      console.error('Error cleaning up mesh:', error);
    }
  },

  handleMeshUpdate: (meshesRef, currentParams) => {
    let needsUpdate = false;

    meshesRef.current.forEach((mesh) => {
      if (
        mesh.userData.currentThickness !== currentParams.layerThickness ||
        mesh.userData.currentSpacing !== currentParams.layerSpacing
      ) {
        needsUpdate = true;
      }
    });

    if (needsUpdate) {
      meshesRef.current.forEach((mesh) => {
        if (mesh.userData.currentThickness !== currentParams.layerThickness) {
          const newGeometry = new THREE.BoxGeometry(
            mesh.userData.width,
            mesh.userData.height,
            currentParams.layerThickness
          );
          mesh.geometry.dispose();
          mesh.geometry = newGeometry;
          mesh.userData.currentThickness = currentParams.layerThickness;
        }

        const zIndex = (mesh.userData.zIndex as number) ?? 0;
        const newZ = zIndex * (currentParams.layerSpacing + currentParams.layerThickness);
        if (mesh.position.z !== newZ) {
          mesh.position.z = newZ;
          mesh.userData.currentSpacing = currentParams.layerSpacing;
        }

        mesh.updateMatrix();
        mesh.updateMatrixWorld(true);
      });

      set({ needsUpdate: false });
    }
  },

  cleanupMeshesFromScene: (meshesRef, scene) => {
    const state = get();
    meshesRef.current.forEach((mesh) => {
      state.cleanupMesh(mesh);
      scene.remove(mesh);
    });
    meshesRef.current = [];
    state.setMeshes([]);
  },

  validateMeshes: (meshes) => {
    if (!meshes.length) {
      return false;
    }
    return meshes.every(
      (mesh) =>
        mesh?.geometry &&
        !mesh.geometry.dispose &&
        mesh.material &&
        !(mesh.material as THREE.MeshStandardMaterial).dispose
    );
  },

  updateDimensions: (meshes, dimensions, currentParams) => {
    const aspectRatio = dimensions.width / dimensions.height;
    meshes.forEach((mesh) => {
      if (!mesh.geometry.dispose) {
        return;
      }

      const baseSize = 5;
      const width =
        aspectRatio === 1 ? baseSize : aspectRatio > 1 ? baseSize * aspectRatio : baseSize;
      const height =
        aspectRatio === 1 ? baseSize : aspectRatio > 1 ? baseSize : baseSize / aspectRatio;
      const newGeometry = new THREE.BoxGeometry(width, height, currentParams.layerThickness);

      mesh.geometry.dispose();
      mesh.geometry = newGeometry;
      mesh.userData.width = width;
      mesh.userData.height = height;
      mesh.userData.aspectRatio = aspectRatio;

      mesh.updateMatrix();
      mesh.updateMatrixWorld(true);
    });
  },

  setDimensions: (dimensions) => {
    const { meshes, getCurrentParams, updateDimensions } = get();
    set({ dimensions });
    if (meshes.length > 0) {
      updateDimensions(meshes, dimensions, getCurrentParams());
    }
  },

  setGeometryParams: (params) =>
    set((state) => ({
      geometryParams: { ...state.geometryParams, ...params },
    })),

  setMeshes: (meshes) => set({ meshes }),
});
