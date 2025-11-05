import * as THREE from 'three';

export interface LayerInfo {
  layer: string;
  trait: string;
}

export interface SpriteSheetLayout {
  rows: number;
  cols: number;
  frameWidth: number;
  frameHeight: number;
  totalSheets: number;
  framesPerSheet: number;
  totalFrames: number;
}

export interface SpriteSheetData {
  texture: THREE.Texture;
  frameCount: number;
  frameWidth: number;
  frameHeight: number;
  image: HTMLImageElement;
  layout: SpriteSheetLayout;
  sheetIndex: number;
}
