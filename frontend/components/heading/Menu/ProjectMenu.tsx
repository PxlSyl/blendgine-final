import React from 'react';
import { Effect } from 'effect';

import { useProjectSetup } from '@/components/store/projectSetup/hook';
import { useSaveLoadStore } from '@/components/store/saveLoad';
import { useStore } from '@/components/store';
import { useKeyboardShortcuts } from '@/components/hooks/useKeyboardShortcuts';

import MenuLayout from './Components/MenuLayout';
import MenuButton from './Components/MenuButton';

interface ProjectMenuProps {
  disabled?: boolean;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

const ProjectMenu: React.FC<ProjectMenuProps> = ({ disabled = false, isOpen, onOpen, onClose }) => {
  const { selectedFolder, handleSelectFolder, validateAndReloadLayers } = useProjectSetup();
  const { setStep, setActiveSection } = useStore();
  const { saveProjectConfig, loadProjectConfig } = useSaveLoadStore();

  const handleProjectSetup = () => {
    setStep(1);
    setActiveSection('create');
    onClose();
  };

  const handleFolderSelect = async () => {
    await Effect.runPromise(
      Effect.tryPromise({
        try: async () => {
          setStep(1);
          setActiveSection('create');
          onClose();
          await handleSelectFolder();
        },
        catch: (error) => {
          console.error('Error selecting folder:', error);
          if (error instanceof Error) {
            console.error('Error details:', error.message);
          }
        },
      })
    );
  };

  const handleReloadProject = async () => {
    if (selectedFolder) {
      await Effect.runPromise(
        Effect.tryPromise({
          try: async () => {
            setStep(1);
            setActiveSection('create');
            onClose();
            await validateAndReloadLayers(selectedFolder);
          },
          catch: (error) => {
            console.error('Error reloading project:', error);
            if (error instanceof Error) {
              console.error('Error details:', error.message);
            }
          },
        })
      );
    }
  };

  const handleSaveProject = async () => {
    if (selectedFolder) {
      await Effect.runPromise(
        Effect.tryPromise({
          try: () => saveProjectConfig(),
          catch: (error) => {
            console.error('Error saving project:', error);
            if (error instanceof Error) {
              console.error('Error details:', error.message);
            }
          },
        })
      );
      onClose();
    }
  };

  const handleLoadProject = async () => {
    await Effect.runPromise(
      Effect.tryPromise({
        try: () => loadProjectConfig(),
        catch: (error) => {
          console.error('Error loading project:', error);
          if (error instanceof Error) {
            console.error('Error details:', error.message);
          }
        },
      })
    );
    onClose();
  };

  useKeyboardShortcuts({
    'ctrl+p': () => !disabled && handleProjectSetup(),
    'ctrl+o': () => !disabled && void handleFolderSelect(),
    'ctrl+r': () => !disabled && void handleReloadProject(),
    'ctrl+s': () => !disabled && void handleSaveProject(),
    'ctrl+l': () => !disabled && void handleLoadProject(),
  });

  return (
    <MenuLayout
      label="Project"
      isOpen={isOpen}
      setIsOpen={(open) => (open ? onOpen() : onClose())}
      disabled={disabled}
    >
      <MenuButton onClick={handleProjectSetup} shortcut="Ctrl+P">
        <span>Project setup</span>
      </MenuButton>
      <MenuButton onClick={() => void handleFolderSelect()} shortcut="Ctrl+O">
        <span>Select folder</span>
      </MenuButton>
      <MenuButton
        onClick={() => void handleReloadProject()}
        disabled={!selectedFolder}
        shortcut="Ctrl+R"
      >
        <span>Reload project</span>
      </MenuButton>
      <MenuButton
        onClick={() => void handleSaveProject()}
        disabled={!selectedFolder}
        shortcut="Ctrl+S"
      >
        <span>Save project</span>
      </MenuButton>
      <MenuButton onClick={() => void handleLoadProject()} shortcut="Ctrl+L" isLast>
        <span>Load project</span>
      </MenuButton>
    </MenuLayout>
  );
};

export default ProjectMenu;
