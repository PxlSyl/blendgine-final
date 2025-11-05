import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { useStore } from '@/components/store';
import { useUpdateStore } from '@/components/store/update';
import { useProjectSetup } from '@/components/store/projectSetup/hook';

import { createsteps, managesteps } from './steps';
import { TabButton } from './TabButton';
import { SectionHeader } from './SectionHeader';
import { BottomNav } from './BottomNav';
import { PaletteIcon, ManageIcon } from '@/components/icons';

interface StepTabsProps {
  handleStepChange: (step: number) => void;
  handleMetadataTabChange?: (step: number) => void;
}

const StepTabs: React.FC<StepTabsProps> = React.memo(
  ({ handleStepChange, handleMetadataTabChange }) => {
    const isCreateOpen = useStore((state) => state.isCreateOpen);
    const setIsCreateOpen = useStore((state) => state.setIsCreateOpen);
    const isManageOpen = useStore((state) => state.isManageOpen);
    const setIsManageOpen = useStore((state) => state.setIsManageOpen);
    const step = useStore((state) => state.step);
    const metadataStep = useUpdateStore((state) => state.metadataStep);
    const activeSection = useStore((state) => state.activeSection);
    const { selectedFolder, hasSelectedFolder } = useProjectSetup();
    const sidebarFull = useStore((state) => state.sidebarFull);

    const handleSectionToggle = (section: 'create' | 'manage') => {
      if (section === 'create') {
        setIsCreateOpen(!isCreateOpen);
        setIsManageOpen(false);
      } else {
        setIsManageOpen(!isManageOpen);
        setIsCreateOpen(false);
      }
    };

    const handleTabClick = (section: 'create' | 'manage', id: number) => {
      const { setActiveSection } = useStore.getState();

      if (section === 'create') {
        setActiveSection('create');
        handleStepChange(id);
      } else {
        setActiveSection('manage');
        handleMetadataTabChange?.(id);
      }
    };

    return (
      <div
        className={`bg-gray-300 dark:bg-gray-900 flex flex-col h-full w-[48px] ${sidebarFull ? 'lg:w-[200px]' : 'lg:w-[48px]'} pl-2 pt-2`}
      >
        <SectionHeader
          label="Create"
          isSelected={isCreateOpen}
          onClick={() => handleSectionToggle('create')}
          icon={<PaletteIcon className="w-6 h-6" />}
          sidebarFull={sidebarFull}
        />
        <AnimatePresence>
          {isCreateOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{
                duration: 0.3,
                ease: 'easeInOut',
                height: {
                  duration: 0.4,
                },
                opacity: {
                  duration: 0.25,
                },
              }}
            >
              {createsteps.map((item) => (
                <TabButton
                  key={item.id}
                  isSelected={step === item.id && activeSection === 'create'}
                  onClick={() => handleTabClick('create', item.id)}
                  icon={item.icon}
                  label={item.label}
                  layoutId="selectedTab"
                  disabled={
                    item.id === 1 ? false : hasSelectedFolder || (!selectedFolder && item.id <= 4)
                  }
                  sidebarFull={sidebarFull}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <SectionHeader
          label="Manage"
          isSelected={isManageOpen}
          onClick={() => handleSectionToggle('manage')}
          icon={<ManageIcon className="w-6 h-5" />}
          sidebarFull={sidebarFull}
        />
        <AnimatePresence>
          {isManageOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{
                duration: 0.3,
                ease: 'easeInOut',
                height: {
                  duration: 0.4,
                },
                opacity: {
                  duration: 0.25,
                },
              }}
            >
              {managesteps.map((item) => (
                <TabButton
                  key={item.id}
                  isSelected={metadataStep === item.id && activeSection === 'manage'}
                  onClick={() => handleTabClick('manage', item.id)}
                  icon={item.icon}
                  label={item.label}
                  layoutId="selectedTab"
                  disabled={hasSelectedFolder}
                  sidebarFull={sidebarFull}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-auto">
          <BottomNav />
        </div>
      </div>
    );
  }
);

StepTabs.displayName = 'StepTabs';

export default StepTabs;
