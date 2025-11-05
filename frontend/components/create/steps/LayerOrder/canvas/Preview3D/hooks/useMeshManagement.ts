import { useEffect, useCallback, useRef } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { useLayerOrder } from '@/components/store/layerOrder/hook';
import { useProjectSetup } from '@/components/store/projectSetup/hook';

interface UseMeshManagementProps {
  meshesRef: React.RefObject<THREE.Mesh[]>;
  layers: string[];
  currentTraits: Record<string, string>;
  generationId: number;
}

export const useMeshManagement = ({
  meshesRef,
  layers,
  currentTraits,
  generationId,
}: UseMeshManagementProps) => {
  const { scene } = useThree();
  const setupComplete = useRef(false);

  const {
    cleanupMeshesFromScene,
    createMesh,
    setMeshes,
    getCurrentParams,
    images,
    rarityConfig,
    activeSetId,
    framesByLayer,
    loadAnimatedImages,
  } = useLayerOrder();

  const { isAnimatedCollection, spritesheetLayout } = useProjectSetup();

  const currentSetId = activeSetId ?? 'set1';

  const createMeshesForLayers = useCallback(async () => {
    cleanupMeshesFromScene(meshesRef, scene);

    const currentParams = getCurrentParams();
    const { layerSpacing, layerThickness } = currentParams;

    const meshesWithZIndex: Array<{ mesh: THREE.Mesh; zIndex: number; layerName: string }> = [];

    const getZIndex = (layer: string, traitName: string): number => {
      const layerConfig = rarityConfig[layer];
      const traitConfig = layerConfig?.traits?.[traitName];

      if (traitConfig?.sets) {
        let zIndex = traitConfig.sets[currentSetId]?.zIndex;

        zIndex ??= traitConfig.sets['default']?.zIndex;

        if (zIndex !== undefined && zIndex !== null) {
          const parsedZIndex = parseInt(String(zIndex), 10);
          return isNaN(parsedZIndex) ? layers.indexOf(layer) * 100 : parsedZIndex;
        }
      }

      return layers.indexOf(layer) * 100;
    };

    const sortedImages = [...images].sort((a, b) => {
      const aZIndex = getZIndex(a.layerName, a.traitName);
      const bZIndex = getZIndex(b.layerName, b.traitName);
      return aZIndex - bZIndex;
    });

    for (let i = 0; i < sortedImages.length; i++) {
      const currentImage = sortedImages[i];
      const currentZIndex = getZIndex(currentImage.layerName, currentImage.traitName);

      const mesh = await createMesh({
        image: currentImage,
        layerName: currentImage.layerName,
        traitName: currentImage.traitName,
        layerSpacing,
        layerThickness,
        meshIndex: currentZIndex,
      });
      meshesWithZIndex.push({ mesh, zIndex: currentZIndex, layerName: currentImage.layerName });
    }

    meshesWithZIndex.sort((a, b) => a.zIndex - b.zIndex);

    const newMeshes = meshesWithZIndex.map(({ mesh }, index) => {
      const spacing = currentParams.layerSpacing;
      const thickness = currentParams.layerThickness;
      mesh.position.z = index * (spacing + thickness);
      mesh.userData.meshIndex = index;
      scene.add(mesh);
      return mesh;
    });

    meshesRef.current = newMeshes;
    setMeshes(newMeshes);
  }, [
    layers,
    cleanupMeshesFromScene,
    scene,
    rarityConfig,
    currentSetId,
    images,
    createMesh,
    setMeshes,
    meshesRef,
    getCurrentParams,
  ]);

  useEffect(() => {
    if (generationId > 0 && !setupComplete.current) {
      const initializeMeshes = async () => {
        try {
          await createMeshesForLayers();

          const loadPromises = meshesRef.current.map(async (mesh) => {
            const { layerName, traitName } = mesh.userData as {
              layerName: string;
              traitName: string;
            };
            if (!layerName || !traitName) {
              return;
            }

            try {
              if (isAnimatedCollection) {
                if (!spritesheetLayout) {
                  console.warn('No spritesheet layout available for animated collection');
                  return;
                }

                const existingFrames = framesByLayer[layerName]?.[traitName];
                if (!existingFrames?.length) {
                  await loadAnimatedImages(layerName, traitName);
                }

                const spritesheets = framesByLayer[layerName]?.[traitName];
                if (spritesheets?.length) {
                  const material = mesh.material as THREE.MeshStandardMaterial;
                  if (material?.map) {
                    const [{ texture }] = spritesheets;
                    material.map = texture;
                    if (texture) {
                      texture.wrapS = THREE.RepeatWrapping;
                      texture.wrapT = THREE.RepeatWrapping;
                      texture.minFilter = THREE.NearestFilter;
                      texture.magFilter = THREE.NearestFilter;
                      texture.generateMipmaps = false;
                      texture.anisotropy = 1;

                      const frameWidth = 1 / spritesheetLayout.cols;
                      const frameHeight = 1 / spritesheetLayout.rows;
                      texture.repeat.set(frameWidth, frameHeight);
                      texture.offset.set(0, 1 - frameHeight);
                      texture.needsUpdate = true;
                      material.needsUpdate = true;
                    }

                    mesh.userData.currentFrame = 0;
                    mesh.userData.lastFrameTime = performance.now();
                    mesh.userData.currentSheetIndex = 0;
                  }
                }
              } else {
                const layerImage = images.find(
                  (img) => img.layerName === layerName && img.traitName === traitName
                );

                if (layerImage?.element) {
                  const material = mesh.material as THREE.MeshStandardMaterial;
                  if (material?.map) {
                    const texture = new THREE.Texture(layerImage.element);
                    texture.needsUpdate = true;
                    texture.minFilter = THREE.NearestFilter;
                    texture.magFilter = THREE.NearestFilter;
                    texture.generateMipmaps = false;
                    texture.anisotropy = 1;
                    texture.format = THREE.RGBAFormat;
                    texture.colorSpace = THREE.SRGBColorSpace;
                    material.map = texture;
                    material.needsUpdate = true;
                  }
                }
              }
            } catch (error) {
              console.error(`Failed to initialize mesh for ${layerName}/${traitName}:`, error);
            }
          });

          await Promise.all(loadPromises);
          setupComplete.current = true;
        } catch (error) {
          console.error('Error initializing meshes:', error);
        }
      };

      if (images.length > 0) {
        void initializeMeshes();
      }
    }
  }, [
    generationId,
    createMeshesForLayers,
    images.length,
    framesByLayer,
    images,
    isAnimatedCollection,
    loadAnimatedImages,
    meshesRef,
    spritesheetLayout,
  ]);

  useEffect(() => {
    const updateTextures = () => {
      for (const mesh of meshesRef.current) {
        const { layerName } = mesh.userData as { layerName: string; traitName: string };
        const newTraitName = currentTraits[layerName];

        if (newTraitName && newTraitName !== mesh.userData.traitName) {
          mesh.userData.traitName = newTraitName;

          if (isAnimatedCollection && spritesheetLayout) {
            if (newTraitName === 'None') {
              const material = mesh.material as THREE.MeshStandardMaterial;
              material.visible = false;
              continue;
            }

            const spritesheets = framesByLayer[layerName]?.[newTraitName];
            if (spritesheets?.length) {
              const material = mesh.material as THREE.MeshStandardMaterial;
              if (material?.map) {
                const [{ texture }] = spritesheets;
                material.map = texture;
                if (texture) {
                  texture.wrapS = THREE.RepeatWrapping;
                  texture.wrapT = THREE.RepeatWrapping;
                  texture.minFilter = THREE.NearestFilter;
                  texture.magFilter = THREE.NearestFilter;
                  texture.generateMipmaps = false;
                  texture.anisotropy = 1;

                  const frameWidth = 1 / spritesheetLayout.cols;
                  const frameHeight = 1 / spritesheetLayout.rows;
                  texture.repeat.set(frameWidth, frameHeight);
                  texture.offset.set(0, 1 - frameHeight);
                  texture.needsUpdate = true;
                  material.needsUpdate = true;
                }
              }
            }
          } else {
            if (newTraitName === 'None') {
              const material = mesh.material as THREE.MeshStandardMaterial;
              material.visible = false;
              continue;
            }

            const layerImage = images.find(
              (img) => img.layerName === layerName && img.traitName === newTraitName
            );

            if (layerImage?.element) {
              const material = mesh.material as THREE.MeshStandardMaterial;
              if (material?.map) {
                const texture = new THREE.Texture(layerImage.element);
                texture.needsUpdate = true;
                texture.minFilter = THREE.NearestFilter;
                texture.magFilter = THREE.NearestFilter;
                texture.generateMipmaps = false;
                texture.anisotropy = 1;
                texture.format = THREE.RGBAFormat;
                texture.colorSpace = THREE.SRGBColorSpace;
                material.map = texture;
                material.needsUpdate = true;
              }
            }
          }
        }
      }
    };

    if (meshesRef.current.length > 0) {
      void updateTextures();
    }
  }, [currentTraits, meshesRef, framesByLayer, images, isAnimatedCollection, spritesheetLayout]);

  return { setupComplete };
};
