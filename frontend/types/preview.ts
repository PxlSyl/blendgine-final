interface BaseFrame {
  element: HTMLImageElement;
}

interface PathFrame extends BaseFrame {
  path: string;
}

type Frame = PathFrame;

export interface PreviewImage {
  element: HTMLImageElement;
  layerName: string;
  traitName: string;
  blendMode: string;
  opacity: number;
  isBlendResult?: boolean;
  frames?: Frame[];
  frameCount?: number;
  hasAnimatedImages?: boolean;
  zIndex?: number;
}
