export const isTauriAvailable = (): boolean => {
  return typeof window !== 'undefined' && '__TAURI__' in window;
};

export const isTauriEventSystemAvailable = (): boolean => {
  return (
    typeof window !== 'undefined' &&
    '__TAURI__' in window &&
    'event' in window.__TAURI__ &&
    'listen' in window.__TAURI__.event
  );
};

export const getTauriWindow = () => {
  if (!isTauriAvailable()) {
    throw new Error('Tauri is not available in this environment');
  }
  return window as unknown as Window & { __TAURI__ };
};
