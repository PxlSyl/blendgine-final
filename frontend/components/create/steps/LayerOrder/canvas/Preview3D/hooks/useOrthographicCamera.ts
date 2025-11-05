import { useEffect } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { useLayerOrder } from '@/components/store/layerOrder/hook';

interface UseOrthographicCameraProps {
  meshesRef: React.RefObject<THREE.Mesh[]>;
  dimensions?: { width: number; height: number };
}

export const useOrthographicCamera = ({ meshesRef, dimensions }: UseOrthographicCameraProps) => {
  const { camera } = useThree();
  const { getCurrentParams } = useLayerOrder();
  const currentParams = getCurrentParams();

  useEffect(() => {
    if (camera && camera instanceof THREE.OrthographicCamera && dimensions) {
      const aspectRatio = dimensions.width / dimensions.height;
      const baseSize = 2;
      const frustumHeight = baseSize;
      const frustumWidth = baseSize * aspectRatio;

      camera.left = -frustumWidth;
      camera.right = frustumWidth;
      camera.top = frustumHeight;
      camera.bottom = -frustumHeight;

      const totalLayers = meshesRef.current.length;
      const { layerSpacing, layerThickness } = currentParams;
      const totalDepth = (totalLayers - 1) * (layerSpacing + layerThickness);
      camera.position.z = Math.max(5, totalDepth + 2);
      camera.updateProjectionMatrix();
    }
  }, [camera, dimensions, meshesRef, currentParams]);
};
