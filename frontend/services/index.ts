import { TauriApiService } from './tauri-api';
import { isTauriAvailable } from '../utils/tauri';

export const api: TauriApiService = isTauriAvailable()
  ? TauriApiService.getInstance()
  : (null as unknown as TauriApiService);
