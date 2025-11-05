import { useEffect, useCallback, useState } from 'react';
import { listen } from '@tauri-apps/api/event';
import { convertFileSrc } from '@tauri-apps/api/core';

export interface GridFile {
  url: string;
  name: string;
  format: string;
}

export const useFileWatcher = () => {
  const [gridFiles, setGridFiles] = useState<GridFile[]>([]);
  const [isWatching, setIsWatching] = useState(false);

  const addFile = useCallback((filePath: string, fileName: string, format: string) => {
    let cleanPath = filePath;

    cleanPath = decodeURIComponent(filePath);

    const tauriUrl = convertFileSrc(cleanPath);

    const newFile: GridFile = {
      url: tauriUrl,
      name: fileName,
      format,
    };

    setGridFiles((prev) => {
      const newFiles = [...prev, newFile];
      return newFiles;
    });
  }, []);

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = listen(
      'file-created',
      (event: { payload: { file_path: string; file_name: string; format: string } }) => {
        if (!isMounted) {
          return;
        }

        const { file_path, file_name, format } = event.payload;

        if (file_path && file_name) {
          setIsWatching(true);
          addFile(file_path, file_name, format);
        }
      }
    );

    return () => {
      isMounted = false;
      void unsubscribe.then((unsub) => unsub());
    };
  }, [addFile]);

  const clearFiles = () => {
    setGridFiles([]);
    setIsWatching(false);
  };

  return {
    gridFiles,
    isWatching,
    clearFiles,
    getLastFile: () => (gridFiles.length > 0 ? gridFiles[gridFiles.length - 1] : undefined),
  };
};
