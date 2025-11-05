import { TauriApiService } from './tauri-api';

export type TauriApi = TauriApiService;

export interface LayerContent {
  name: string;
  images: ImageContent[];
}

export interface ImageContent {
  name: string;
  path: string;
}

export interface FolderContent {
  isValid: boolean;
  errorMessage?: string;
  files?: string[];
  folders?: string[];
}

export interface NFTProgressInfo {
  currentCount: number;
  totalCount: number;
  estimatedCount: number;
  sequenceNumber?: number;
  currentImage?: {
    path: string | undefined;
    name: string | undefined;
    traits: Record<string, string> | undefined;
  };
}

export type EffectPreviewResponseFile =
  | { status: 'Success'; data: EffectPreviewImageFile }
  | { status: 'Error'; error: string }
  | { status: 'Cancelled' };

export interface EffectPreviewImageFile {
  filePath: string;
  originalFilePath: string;
  mimeType: string;
  originalMimeType: string;
}

export type FilterProgressResponse = {
  count: number;
  total: number;
  estimatedCount: number;
};

export type FolderSelectionResponse =
  | { status: 'Confirmed'; path: string }
  | { status: 'Cancelled' }
  | { status: 'Error'; error: string };

export type FilterApplicationResponse =
  | { status: 'Success'; data: { path: string } }
  | { status: 'Error'; error: string }
  | { status: 'Cancelled' };

export interface DialogOptions {
  title: string;
  message: string;
  dialogType: 'warning' | 'error' | 'info';
}
