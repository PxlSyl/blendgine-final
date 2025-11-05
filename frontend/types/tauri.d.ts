declare global {
  interface Window {
    __TAURI__: {
      invoke: <T>(cmd: string, args?: unknown) => Promise<T>;
      event: {
        listen: <T>(
          event: string,
          callback: (event: { payload: T }) => void
        ) => Promise<() => void>;
      };
      path: {
        appDir: () => Promise<string>;
        appDataDir: () => Promise<string>;
      };
      dialog: {
        open: (options?: { directory?: boolean }) => Promise<string | string[] | null>;
        save: (options?: { defaultPath?: string }) => Promise<string | null>;
      };
      shell: {
        open: (path: string) => Promise<void>;
      };
      [key: string]: unknown;
    };
  }
}

export {};
