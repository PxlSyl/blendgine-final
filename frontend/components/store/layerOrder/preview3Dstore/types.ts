import * as THREE from 'three';
import { OrbitControls } from 'three-stdlib';
import { OrthographicCamera, PerspectiveCamera } from 'three';

import type { PreviewImage } from '@/types/preview';
import type { SpriteSheetData, SpriteSheetLayout } from '@/types/cannevasTypes';

export interface CameraState {
  position: THREE.Vector3;
  rotation: THREE.Euler;
  target: THREE.Vector3;
  zoom: number;
}

export interface ViewParams {
  layerSpacing: number;
  layerThickness: number;
  zoom: number;
}

export interface OrbitControlsParams {
  enableDamping: boolean;
  dampingFactor: number;
  rotateSpeed: number;
  zoomSpeed: number;
  panSpeed: number;
  minDistance: number;
  maxDistance: number;
  target: [number, number, number];
}

export interface TextureCacheEntry {
  texture: THREE.Texture;
  lastUsed: number;
  priority: number;
}

export interface TextureCache {
  [key: string]: TextureCacheEntry;
}

export interface TextureManager {
  cache: TextureCache;
  addTexture: (key: string, texture: THREE.Texture, priority?: number) => void;
  getTexture: (key: string) => THREE.Texture | null;
  cleanup: () => void;
  clear: () => void;
}

export interface AnimationState {
  isPaused: boolean;
  lastFrame: number;
  lastFrameTime: number;
  animationFrameId?: number;
  wasPlaying: boolean;
}

export interface Preview3DState {
  viewMode: '2d' | '3d';
  materialCache: Map<string, THREE.Material>;
  isBlendUpdate: boolean;
  isUpdating: boolean;
  isGenerating: boolean;
  generationId: number;
  currentGenerationId: number;
  meshes: THREE.Mesh[];
  lightingParams: {
    ambient: {
      intensity: number;
    };
    directional: {
      position: [number, number, number];
      intensity: number;
    };
  };

  geometryParams: {
    defaultWidth: number;
    colorSpace: THREE.ColorSpace;
  };

  textureCache: Map<string, THREE.Texture>;
  geometryCache: Map<string, THREE.BoxGeometry>;

  cameraType: 'perspective' | 'orthographic';
  perspectiveCameraState: CameraState;
  orthographicCameraState: CameraState;
  perspectiveParams: ViewParams;
  orthographicParams: ViewParams;
  perspectiveControls: OrbitControlsParams;
  orthographicControls: OrbitControlsParams;

  updateMeshPositions: () => void;
  updateMeshThickness: () => void;

  clearGeometryCache: () => void;
  clearTextureCache: () => void;

  setOrbitControls: (params: Partial<OrbitControlsParams>) => void;
  setGeometryParams: (params: Partial<Preview3DState['geometryParams']>) => void;

  setViewMode: (mode: '2d' | '3d') => void;
  triggerGeneration: () => Promise<void>;
  clearCache: () => void;
  setMeshes: (meshes: THREE.Mesh[]) => void;
  setIsGenerating: (value: boolean) => void;

  createMesh: (params: {
    image: PreviewImage;
    layerName: string;
    traitName: string;
    layerSpacing: number;
    layerThickness: number;
    meshIndex: number;
  }) => Promise<THREE.Mesh>;

  updateMeshTextures: (meshes: THREE.Mesh[], images: PreviewImage[]) => void;

  cleanupMesh: (mesh: THREE.Mesh) => void;

  setCameraType: (type: 'perspective' | 'orthographic') => void;
  setPerspectiveCameraState: (state: CameraState) => void;
  setOrthographicCameraState: (state: CameraState) => void;
  setPerspectiveControls: (params: Partial<Preview3DState['perspectiveControls']>) => void;
  setOrthographicControls: (params: Partial<Preview3DState['orthographicControls']>) => void;
  setLayerSpacing: (spacing: number, viewType: 'perspective' | 'orthographic') => void;
  setLayerThickness: (thickness: number, viewType: 'perspective' | 'orthographic') => void;

  getCurrentControls: () => OrbitControlsParams;
  getCurrentParams: () => ViewParams;
  setCurrentControls: (params: Partial<OrbitControlsParams>) => void;
  resetToFlatView: () => void;

  needsUpdate: boolean;

  updateQueue: Set<string>;
  batchUpdate: boolean;

  meshCache: Record<string, THREE.Mesh[]>;

  handleMeshUpdate: (
    meshesRef: React.MutableRefObject<THREE.Mesh[]>,
    currentParams: ViewParams
  ) => void;

  handleCameraSave: (
    camera: THREE.PerspectiveCamera | THREE.OrthographicCamera,
    controls: OrbitControls,
    cameraType: 'perspective' | 'orthographic'
  ) => void;

  handleCameraRestore: (
    camera: PerspectiveCamera | OrthographicCamera,
    controls: OrbitControls,
    cameraType: 'perspective' | 'orthographic'
  ) => void;

  cleanupMeshesFromScene: (
    meshesRef: React.MutableRefObject<THREE.Mesh[]>,
    scene: THREE.Scene
  ) => void;

  setZoom: (value: number, cameraType: 'perspective' | 'orthographic') => void;
  updateCamera: () => void;

  camera?: THREE.PerspectiveCamera | THREE.OrthographicCamera;
  activeControls?: OrbitControls;

  setActiveControls: (controls: OrbitControls) => void;

  setCamera: (camera: THREE.PerspectiveCamera | THREE.OrthographicCamera) => void;

  dimensions?: {
    width: number;
    height: number;
  };
  setDimensions: (dimensions: { width: number; height: number }) => void;

  setPerspectiveParams: (params: ViewParams) => void;
  setOrthographicParams: (params: ViewParams) => void;

  validateMeshes: (meshes: THREE.Mesh[]) => boolean;
  updateDimensions: (
    meshes: THREE.Mesh[],
    dimensions: { width: number; height: number },
    currentParams: ViewParams
  ) => void;

  animationFrameId?: number;
  frameInterval: number;
  lastFrameTime: number;

  startAnimation: () => void;
  stopAnimation: () => void;

  framesByLayer: Record<string, Record<string, SpriteSheetData[]>>;
  loadAnimatedImages: (layerName: string, traitName: string) => Promise<void>;

  loadBlendedFrames: (blendedDir: string) => Promise<{
    element: HTMLImageElement;
    frames: { element: HTMLImageElement; path: string }[];
  }>;

  fps: number;
  setFPS: (fps: number) => void;

  textureManager: TextureManager;

  projectId: string | null;
  spritesheetLayout: SpriteSheetLayout | null;

  resetPreview3DStore: () => Promise<void>;
  setGenerationId: (id: number) => void;

  maxFrames: number;
  currentFrame: number;
  setCurrentFrame: (frame: number) => void;
  setMaxFrames: (frames: number) => void;

  // Animation state
  animationState: AnimationState;
  setAnimationState: (state: {
    isPaused: boolean;
    lastFrame: number;
    lastFrameTime: number;
  }) => void;
  handleGenerationStateChange: (isGenerating: boolean) => void;
}
