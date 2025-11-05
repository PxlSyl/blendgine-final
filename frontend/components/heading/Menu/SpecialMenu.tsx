import React from 'react';

import { useStore } from '@/components/store';
import { useKeyboardShortcuts } from '@/components/hooks/useKeyboardShortcuts';

import MenuLayout from './Components/MenuLayout';
import MenuButton from './Components/MenuButton';

interface SpecialMenuProps {
  disabled?: boolean;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

const SpecialMenu: React.FC<SpecialMenuProps> = ({ disabled = false, isOpen, onOpen, onClose }) => {
  const { setStep, setActiveSection } = useStore();

  const handleEffects = () => {
    setStep(5);
    setActiveSection('create');
    onClose();
  };

  const handleLegendary = () => {
    setStep(6);
    setActiveSection('create');
    onClose();
  };

  useKeyboardShortcuts({
    'ctrl+e': () => !disabled && handleEffects(),
    'ctrl+d': () => !disabled && handleLegendary(),
  });

  return (
    <MenuLayout
      label="Special"
      isOpen={isOpen}
      setIsOpen={(open) => (open ? onOpen() : onClose())}
      disabled={disabled}
    >
      <MenuButton onClick={handleEffects} shortcut="Ctrl+E">
        <span>Effects</span>
      </MenuButton>
      <MenuButton onClick={handleLegendary} shortcut="Ctrl+D" isLast>
        <span>Legendary</span>
      </MenuButton>
    </MenuLayout>
  );
};

export default SpecialMenu;
