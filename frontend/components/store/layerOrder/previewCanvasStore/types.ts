import type { SpriteSheetData } from '@/types/cannevasTypes';
import type { PreviewImage } from '@/types/preview';

export interface PreviewCanvasStore {
  images: PreviewImage[];
  error: string | null;
  framesByLayer: Record<string, Record<string, SpriteSheetData[]>>;
  resetPreviewCanvasStore: () => Promise<void>;
  loadImages: (selectedFolder: string, layers: string[], generationId: number) => Promise<void>;
  updateImagesOrder: (newOrder: string[]) => void;
  clearImages: () => void;
}
