import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import { useLayerOrder } from '@/components/store/layerOrder/hook';
import { useProjectSetup } from '@/components/store/projectSetup/hook';
import { calculateTotalFrames } from '../../utils/spritesheetUtils';

interface UseMeshAnimationProps {
  meshesRef: React.RefObject<THREE.Mesh[]>;
}

export const useMeshAnimation = ({ meshesRef }: UseMeshAnimationProps) => {
  const isMounted = useRef(true);
  const lastFrameRef = useRef(0);

  const { framesByLayer, currentFrame, animationState } = useLayerOrder();
  const { isAnimatedCollection, spritesheetLayout } = useProjectSetup();

  useFrame(() => {
    if (!meshesRef.current.length || !isMounted.current) {
      return;
    }

    if (!isAnimatedCollection || !spritesheetLayout) {
      return;
    }

    const frameChanged = currentFrame !== lastFrameRef.current;
    if (animationState.isPaused && !frameChanged) {
      return;
    }

    lastFrameRef.current = currentFrame;

    meshesRef.current.forEach((mesh) => {
      if (!mesh || !isMounted.current) {
        return;
      }

      const material = mesh.material as THREE.MeshStandardMaterial;
      if (!material?.map) {
        return;
      }

      const layerName = mesh.userData.layerName as string;
      const traitName = mesh.userData.traitName as string;
      const spritesheets = framesByLayer[layerName]?.[traitName];
      if (!spritesheets?.length) {
        return;
      }

      const totalFrames = calculateTotalFrames(spritesheets);
      const globalFrame = currentFrame % totalFrames;

      let totalFramesProcessed = 0;
      let [currentSpritesheet] = spritesheets;
      let localFrameNum = globalFrame;

      for (const sheet of spritesheets) {
        if (totalFramesProcessed + sheet.frameCount > globalFrame) {
          currentSpritesheet = sheet;
          localFrameNum = globalFrame - totalFramesProcessed;
          break;
        }
        totalFramesProcessed += sheet.frameCount;
      }

      if (currentSpritesheet) {
        const { cols, rows } = currentSpritesheet.layout;

        if (cols && rows) {
          const col = localFrameNum % cols;
          const row = Math.floor(localFrameNum / cols);

          if (material.map !== currentSpritesheet.texture) {
            material.map = currentSpritesheet.texture;
            material.map.wrapS = THREE.RepeatWrapping;
            material.map.wrapT = THREE.RepeatWrapping;
            material.map.minFilter = THREE.NearestFilter;
            material.map.magFilter = THREE.NearestFilter;
            material.map.generateMipmaps = false;
            material.map.anisotropy = 1;
            material.needsUpdate = true;
          }

          material.map.offset.set(col / cols, 1 - (row + 1) / rows);
          material.map.repeat.set(1 / cols, 1 / rows);
          material.map.needsUpdate = true;
        }
      }
    });
  });

  return { isMounted };
};
