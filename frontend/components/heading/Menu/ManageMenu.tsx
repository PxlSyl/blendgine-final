import React from 'react';

import { useUpdateStore } from '@/components/store/update';
import { useStore } from '@/components/store';
import { useKeyboardShortcuts } from '@/components/hooks/useKeyboardShortcuts';

import MenuLayout from './Components/MenuLayout';
import MenuButton from './Components/MenuButton';

interface ManageMenuProps {
  disabled?: boolean;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

const ManageMenu: React.FC<ManageMenuProps> = ({ disabled = false, isOpen, onOpen, onClose }) => {
  const { setMetadataStep } = useUpdateStore();
  const { setActiveSection } = useStore();

  const handleViewRarity = () => {
    setMetadataStep(1);
    setActiveSection('manage');
    onClose();
  };

  const handleEditSingle = () => {
    setMetadataStep(2);
    setActiveSection('manage');
    onClose();
  };

  const handleBulkEdit = () => {
    setMetadataStep(3);
    setActiveSection('manage');
    onClose();
  };

  useKeyboardShortcuts({
    'ctrl+v': () => !disabled && handleViewRarity(),
    'ctrl+j': () => !disabled && handleEditSingle(),
    'ctrl+b': () => !disabled && handleBulkEdit(),
  });

  return (
    <MenuLayout
      label="Manage"
      isOpen={isOpen}
      setIsOpen={(open) => (open ? onOpen() : onClose())}
      disabled={disabled}
    >
      <MenuButton onClick={handleViewRarity} shortcut="Ctrl+V">
        <span>View collection rarity</span>
      </MenuButton>
      <MenuButton onClick={handleEditSingle} shortcut="Ctrl+J">
        <span>Edit single json file</span>
      </MenuButton>
      <MenuButton onClick={handleBulkEdit} shortcut="Ctrl+B" isLast>
        <span>Json bulk editing</span>
      </MenuButton>
    </MenuLayout>
  );
};

export default ManageMenu;
