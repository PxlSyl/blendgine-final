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

export type FolderSelectionResponse =
  | { status: 'Confirmed'; path: string }
  | { status: 'Cancelled' }
  | { status: 'Error'; error: string };

export interface DialogOptions {
  title: string;
  message: string;
  dialogType: 'warning' | 'error' | 'info';
}
