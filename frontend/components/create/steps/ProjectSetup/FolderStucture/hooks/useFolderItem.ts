import { useState, useCallback } from 'react';
import { Effect } from 'effect';

import { useProjectSetup } from '@/components/store/projectSetup/hook';
import { removeFileExtension } from '@/utils/functionsUtils';

interface UseFolderItemProps {
  folderName: string;
  handleReload: () => Promise<void>;
}

export const useFolderItem = ({ folderName, handleReload }: UseFolderItemProps) => {
  const { renameLayerOrTrait, selectedFolder } = useProjectSetup();
  const [isEditingFolderName, setIsEditingFolderName] = useState(false);
  const [editingFileName, setEditingFileName] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFolderNameSubmit = useCallback(
    (newFolderName?: string) => {
      const inputElement = document.querySelector('input[type="text"]') as HTMLInputElement;
      const finalNewName = newFolderName ?? inputElement?.value;

      if (finalNewName && finalNewName !== folderName) {
        if (selectedFolder) {
          const renameEffect = Effect.gen(function* (_) {
            try {
              yield* _(renameLayerOrTrait(folderName, finalNewName, true, undefined));
            } catch (error) {
              console.error('Error in folder rename effect:', error);
              yield* _(
                Effect.tryPromise({
                  try: () => handleReload(),
                  catch: (error) => {
                    console.error('Error reloading after folder rename:', error);
                    return Promise.resolve();
                  },
                })
              );
            }
          });

          void Effect.runPromise(renameEffect);
        }
      }
      setIsEditingFolderName(false);
    },
    [folderName, renameLayerOrTrait, handleReload, selectedFolder]
  );

  const handleFolderKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        void handleFolderNameSubmit();
      }
    },
    [handleFolderNameSubmit]
  );

  const handleFileNameSubmit = useCallback(
    async (oldFileName: string, newFileNameParam?: string) => {
      if (isSubmitting) {
        return;
      }

      setIsSubmitting(true);

      const inputElement = document.querySelector('input[type="text"]') as HTMLInputElement;
      const finalNewName = newFileNameParam ?? inputElement?.value;

      if (finalNewName && finalNewName !== removeFileExtension(oldFileName)) {
        const extension = oldFileName.match(/\.[^.]+$/)?.[0] ?? '';
        const newNameWithExt = `${finalNewName}${extension}`;

        const renameFileEffect = Effect.gen(function* (_) {
          try {
            yield* _(renameLayerOrTrait(oldFileName, newNameWithExt, false, folderName));
          } catch (error) {
            console.error('Error in file rename effect:', error);
            yield* _(
              Effect.tryPromise({
                try: () => handleReload(),
                catch: (error) => {
                  console.error('Error reloading after trait rename:', error);
                  return Promise.resolve();
                },
              })
            );
          }
        });

        try {
          await Effect.runPromise(renameFileEffect);
          await new Promise((resolve) => setTimeout(resolve, 100));
          setEditingFileName(null);
        } catch (error) {
          console.error('Error during rename:', error);
        } finally {
          setIsSubmitting(false);
        }
      } else {
        setEditingFileName(null);
        setIsSubmitting(false);
      }
    },
    [folderName, renameLayerOrTrait, handleReload, isSubmitting]
  );

  const handleFileKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>, oldFileName: string, newFileName?: string) => {
      if (e.key === 'Enter') {
        void handleFileNameSubmit(oldFileName, newFileName);
      }
    },
    [handleFileNameSubmit]
  );

  const handleStartEditingFile = useCallback((fileName: string) => {
    setEditingFileName(fileName);
  }, []);

  return {
    isEditingFolderName,
    newFolderName: folderName,
    editingFileName,
    handleFolderNameSubmit,
    handleFolderKeyDown,
    handleFileNameSubmit,
    handleFileKeyDown,
    handleStartEditingFile,
    setIsEditingFolderName,
    setEditingFileName,
  };
};
