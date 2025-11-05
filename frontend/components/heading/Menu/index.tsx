import React, { useState, useCallback } from 'react';

import ProjectMenu from './ProjectMenu';
import LayersMenu from './LayersMenu';
import SpecialMenu from './SpecialMenu';
import ManageMenu from './ManageMenu';
import SettingsMenu from './SettingsMenu';
import HelpMenu from './HelpMenu';

import { useThemeColorsStore } from '@/components/windows/theme-colors/store';
import { useIsSelectedStore } from '@/components/store/projectSetup/main/isSelectedStore';
import { useIsProcessing } from '@/components/hooks/useIsProcessing';

type MenuKey = 'project' | 'layers' | 'special' | 'manage' | 'settings' | 'help';

const Menu: React.FC = () => {
  const [openMenu, setOpenMenu] = useState<MenuKey | null>(null);
  const hasSelectedFolder = useIsSelectedStore((state) => state.hasSelectedFolder);
  const isProcessing = useIsProcessing();
  const { openThemeColorsWindow } = useThemeColorsStore();

  const handleOpen = useCallback((key: MenuKey) => {
    setOpenMenu((prev) => (prev === key ? null : key));
  }, []);
  const handleClose = useCallback((key: MenuKey) => {
    setOpenMenu((prev) => (prev === key ? null : prev));
  }, []);

  const handleOpenThemeColorsWindow = useCallback(() => {
    void openThemeColorsWindow();
  }, [openThemeColorsWindow]);

  if (isProcessing) {
    return null;
  }

  return (
    <div className="hidden lg:flex gap-1">
      <ProjectMenu
        disabled={hasSelectedFolder}
        isOpen={openMenu === 'project'}
        onOpen={() => handleOpen('project')}
        onClose={() => handleClose('project')}
      />
      <LayersMenu
        disabled={hasSelectedFolder}
        isOpen={openMenu === 'layers'}
        onOpen={() => handleOpen('layers')}
        onClose={() => handleClose('layers')}
      />
      <SpecialMenu
        disabled={hasSelectedFolder}
        isOpen={openMenu === 'special'}
        onOpen={() => handleOpen('special')}
        onClose={() => handleClose('special')}
      />
      <ManageMenu
        disabled={hasSelectedFolder}
        isOpen={openMenu === 'manage'}
        onOpen={() => handleOpen('manage')}
        onClose={() => handleClose('manage')}
      />
      <SettingsMenu
        disabled={hasSelectedFolder}
        isOpen={openMenu === 'settings'}
        onOpen={() => handleOpen('settings')}
        onClose={() => handleClose('settings')}
        onOpenThemeColorsWindow={handleOpenThemeColorsWindow}
      />
      <HelpMenu
        disabled={hasSelectedFolder}
        isOpen={openMenu === 'help'}
        onOpen={() => handleOpen('help')}
        onClose={() => handleClose('help')}
      />
    </div>
  );
};

export default Menu;
