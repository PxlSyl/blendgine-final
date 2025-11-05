import React, { useRef, useEffect, useCallback, useState } from 'react';
import * as THREE from 'three';
import { OrthographicCamera, PerspectiveCamera } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import Scene3D from './Scene3D';
import { useLayerOrder } from '@/components/store/layerOrder/hook';

interface Preview3DProps {
  layers: string[];
  currentTraits: Record<string, string>;
  perspectiveCameraRef: React.RefObject<THREE.PerspectiveCamera | null>;
  orthographicCameraRef: React.RefObject<THREE.OrthographicCamera | null>;
}

const Preview3D: React.FC<Preview3DProps> = ({
  layers,
  currentTraits,
  perspectiveCameraRef,
  orthographicCameraRef,
}) => {
  const [hasError, setHasError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const meshesRef = useRef<THREE.Mesh[]>([]);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const isUnmountingRef = useRef(false);

  const {
    cameraType,
    perspectiveCameraState,
    orthographicCameraState,
    cleanupMeshesFromScene,
    clearGeometryCache,
    clearTextureCache,
    setZoom,
    perspectiveParams,
    orthographicParams,
  } = useLayerOrder();

  const cleanup = useCallback(() => {
    if (sceneRef.current) {
      cleanupMeshesFromScene(meshesRef, sceneRef.current);
    }
    clearGeometryCache();
    clearTextureCache();

    if (rendererRef.current) {
      rendererRef.current.dispose();

      const gl = rendererRef.current.getContext();
      if (gl && !gl.isContextLost()) {
        rendererRef.current.forceContextLoss?.();
      }

      rendererRef.current.domElement = document.createElement('canvas');
      rendererRef.current = null;
    }
  }, [cleanupMeshesFromScene, clearGeometryCache, clearTextureCache]);

  useEffect(() => {
    return () => {
      isUnmountingRef.current = true;
      cleanup();
    };
  }, [cleanup]);

  const handleError = useCallback(
    (error: Error) => {
      console.error('3D Preview Error:', error);
      setHasError(true);
      cleanup();
    },
    [cleanup]
  );

  const handleWheel = useCallback(
    (event: WheelEvent) => {
      event.preventDefault();
      event.stopPropagation();

      const currentParams = cameraType === 'perspective' ? perspectiveParams : orthographicParams;
      const zoomDelta = -event.deltaY * 0.0015;
      const newZoom = Math.max(0.5, Math.min(9, currentParams.zoom + zoomDelta));

      setZoom(newZoom, cameraType);
    },
    [cameraType, perspectiveParams, orthographicParams, setZoom]
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [handleWheel]);

  if (hasError) {
    return (
      <div className="flex items-center justify-center w-full h-full p-4 text-center">
        <div className="bg-[rgb(var(--color-quaternary)/0.1)] border border-[rgb(var(--color-quaternary))] text-[rgb(var(--color-quaternary))] px-4 py-3 rounded">
          <p className="font-bold">3D Preview Error</p>
          <p>An error occurred while initializing the 3D preview.</p>
          <p className="text-sm mt-2">Please try refreshing the page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col w-full h-full">
      <div ref={containerRef} className="relative grow min-h-0 flex items-center justify-center">
        <div className="relative w-full h-full">
          <Canvas
            gl={{
              preserveDrawingBuffer: true,
              antialias: true,
              toneMapping: THREE.NoToneMapping,
              outputColorSpace: THREE.SRGBColorSpace,
              powerPreference: 'high-performance',
              alpha: true,
              stencil: false,
              depth: true,
              failIfMajorPerformanceCaveat: true,
              precision: 'highp',
              logarithmicDepthBuffer: true,
            }}
            frameloop="always"
            className="w-full h-full"
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            onCreated={({ gl, scene }) => {
              try {
                sceneRef.current = scene;
                rendererRef.current = gl;

                gl.setClearColor(0x000000, 0);
                gl.setPixelRatio(Math.min(window.devicePixelRatio, 2));
              } catch (error) {
                handleError(error as Error);
              }
            }}
            onError={(error: unknown) => {
              handleError(error instanceof Error ? error : new Error(String(error)));
            }}
          >
            {cameraType === 'perspective' ? (
              <PerspectiveCamera
                ref={perspectiveCameraRef}
                makeDefault
                position={perspectiveCameraState.position}
                rotation={perspectiveCameraState.rotation}
                zoom={perspectiveCameraState.zoom}
                fov={45}
                near={0.1}
                far={1000}
              />
            ) : (
              <OrthographicCamera
                ref={orthographicCameraRef}
                makeDefault
                position={orthographicCameraState.position}
                rotation={orthographicCameraState.rotation}
                zoom={orthographicCameraState.zoom}
                near={0.1}
                far={500}
                left={-5}
                right={5}
                top={5}
                bottom={-5}
              />
            )}
            <Scene3D meshesRef={meshesRef} layers={layers} currentTraits={currentTraits} />
          </Canvas>
        </div>
      </div>
    </div>
  );
};

export default React.memo(Preview3D);
