import React, { useState } from 'react';
import * as Effect from 'effect/Effect';

import { useStore } from '@/components/store';

import { useKeyboardShortcuts } from '@/components/hooks/useKeyboardShortcuts';

import { useLayerOrder } from '@/components/store/layerOrder/hook';
import { useRarity } from '@/components/store/rarityStore/hook';
import { useProjectSetup } from '@/components/store/projectSetup/hook';

import { useRulesStore } from '@/components/windows/rules/store/main';
import { useLayersviewStore } from '@/components/windows/layersview/store';

import MenuLayout from './Components/MenuLayout';
import MenuButton from './Components/MenuButton';
import SubMenu from './Components/SubMenu';

interface LayersMenuProps {
  disabled?: boolean;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

const LayersMenu: React.FC<LayersMenuProps> = ({ disabled = false, isOpen, onOpen, onClose }) => {
  const [isRarityMenuOpen, setIsRarityMenuOpen] = useState(false);
  const [isViewMenuOpen, setIsViewMenuOpen] = useState(false);
  const { setStep, setActiveSection } = useStore();
  const { setViewMode } = useLayerOrder();
  const { setViewMode: setRarityViewMode, setChartViewMode } = useRarity();
  const { selectedFolder } = useProjectSetup();
  const { openRulesWindow } = useRulesStore();
  const { openLayersWindow, getAllAvailableLayersAndTraits } = useLayersviewStore();

  const handleOverview = () => {
    if (!selectedFolder) {
      return;
    }

    const loadInitialData = Effect.gen(function* (_) {
      const { layers, traitsByLayer } = yield* _(
        Effect.tryPromise({
          try: () => getAllAvailableLayersAndTraits(),
          catch: (error) => new Error(`Failed to get layers and traits: ${String(error)}`),
        })
      );

      if (layers.length > 0) {
        const [firstLayer] = layers;
        const firstTrait = traitsByLayer[firstLayer]?.[0] || '';
        yield* _(
          Effect.tryPromise({
            try: () => openLayersWindow(firstLayer, firstTrait),
            catch: (error) => new Error(`Failed to open window: ${String(error)}`),
          })
        );
      }
    });

    Effect.runPromise(loadInitialData).catch(console.error);
    onClose();
  };

  const handle2DView = () => {
    if (!selectedFolder) {
      return;
    }
    setStep(2);
    setActiveSection('create');
    setViewMode('2d');
    onClose();
    setIsViewMenuOpen(false);
  };

  const handle3DView = () => {
    if (!selectedFolder) {
      return;
    }
    setStep(2);
    setActiveSection('create');
    setViewMode('3d');
    onClose();
    setIsViewMenuOpen(false);
  };

  const handleRules = () => {
    if (!selectedFolder) {
      return;
    }
    void openRulesWindow();
    onClose();
  };

  const handleRarityPercentages = () => {
    if (!selectedFolder) {
      return;
    }
    setStep(3);
    setActiveSection('create');
    setRarityViewMode('settings');
    onClose();
    setIsRarityMenuOpen(false);
  };

  const handleRarityCharts = () => {
    if (!selectedFolder) {
      return;
    }
    setStep(3);
    setActiveSection('create');
    setRarityViewMode('visualization');
    setChartViewMode('pie');
    onClose();
    setIsRarityMenuOpen(false);
  };

  const handleGeneration = () => {
    if (!selectedFolder) {
      return;
    }
    setStep(4);
    setActiveSection('create');
    onClose();
  };

  useKeyboardShortcuts({
    'shift+i': () => !disabled && selectedFolder && void handleOverview(),
    'ctrl+2': () => !disabled && selectedFolder && handle2DView(),
    'ctrl+3': () => !disabled && selectedFolder && handle3DView(),
    'shift+r': () => !disabled && selectedFolder && handleRules(),
    'ctrl+t': () => !disabled && selectedFolder && handleRarityPercentages(),
    'ctrl+c': () => !disabled && selectedFolder && handleRarityCharts(),
    'ctrl+g': () => !disabled && selectedFolder && handleGeneration(),
  });

  return (
    <MenuLayout
      label="Layers"
      isOpen={isOpen}
      setIsOpen={(open) => (open ? onOpen() : onClose())}
      disabled={disabled}
    >
      <MenuButton
        onClick={() => void handleOverview()}
        disabled={!selectedFolder}
        shortcut="Shift+I"
      >
        <span>Overview</span>
      </MenuButton>
      <MenuButton onClick={handleRules} disabled={!selectedFolder} shortcut="Shift+R">
        <span>Rules</span>
      </MenuButton>
      <SubMenu
        label="View"
        isOpen={isViewMenuOpen}
        disabled={!selectedFolder}
        onMouseEnter={() => selectedFolder && setIsViewMenuOpen(true)}
        onMouseLeave={() => selectedFolder && setIsViewMenuOpen(false)}
      >
        <MenuButton onClick={handle2DView} shortcut="Ctrl+2">
          <span>2D View</span>
        </MenuButton>
        <MenuButton onClick={handle3DView} shortcut="Ctrl+3" isLast>
          <span>3D View</span>
        </MenuButton>
      </SubMenu>
      <SubMenu
        label="Rarity"
        isOpen={isRarityMenuOpen}
        disabled={!selectedFolder}
        onMouseEnter={() => selectedFolder && setIsRarityMenuOpen(true)}
        onMouseLeave={() => selectedFolder && setIsRarityMenuOpen(false)}
      >
        <MenuButton onClick={handleRarityPercentages} shortcut="Ctrl+T">
          <span>Percentages</span>
        </MenuButton>
        <MenuButton onClick={handleRarityCharts} shortcut="Ctrl+C" isLast>
          <span>Charts</span>
        </MenuButton>
      </SubMenu>
      <MenuButton onClick={handleGeneration} disabled={!selectedFolder} shortcut="Ctrl+G" isLast>
        <span>Generation</span>
      </MenuButton>
    </MenuLayout>
  );
};

export default LayersMenu;
