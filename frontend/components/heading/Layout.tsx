import React, { useMemo } from 'react';

import type { mainStoreState, mainStoreActions } from '@/types/stores';
import type { AppState, AppActions } from '@/components/store/generate/types';

import { useStore } from '@/components/store';
import { useGenerateStore } from '@/components/store/generate';
import { useUpdateStore } from '@/components/store/update';

import { State as UpdateState, Actions as UpdateActions } from '../store/update';

import DraggableHeader from '@/components/shared/DraggableHeader';
import GradientBar from '@/components/shared/GradientBar';

import StepTabs from './StepTabs';
import StepContent from './StepContent';
import AnimationOverlay from '@/components/create/generation/AnimationOverlay';

import GlobalLayersviewWindow from '@/components/windows/layersview';
import GlobalShortcutsWindow from '@/components/windows/shortcuts';
import GlobalRulesWindow from '@/components/windows/rules';

import FooterActions from './FooterActions';
import Header from './header';

const Layout: React.FC = () => {
  const setStepSelector = useMemo(
    () => (state: mainStoreState & mainStoreActions) => state.setStep,
    []
  );
  const setMetadataStepSelector = useMemo(
    () => (state: UpdateState & UpdateActions) => state.setMetadataStep,
    []
  );
  const showMenuSelector = useMemo(() => (state: AppState & AppActions) => state.showMenu, []);

  const setStep = useStore(setStepSelector);
  const setMetadataStep = useUpdateStore(setMetadataStepSelector);
  const showMenu = useGenerateStore(showMenuSelector);
  const handleStepChange = (newStep: number) => {
    setStep(newStep);
  };

  const handleMetadataTabChange = (newStep: number) => {
    setMetadataStep(newStep);
  };

  return (
    <>
      {showMenu ? (
        <DraggableHeader>
          <div
            className="w-full bg-gray-300 dark:bg-gray-900 dark:text-white 
        rounded-bl-lg rounded-br-lg h-full flex flex-col"
          >
            <Header />
            <div className="flex flex-1 min-h-0 overflow-hidden">
              <div>
                <StepTabs
                  handleStepChange={handleStepChange}
                  handleMetadataTabChange={handleMetadataTabChange}
                />
              </div>
              <div className="flex flex-col flex-1">
                <div className="flex-1 overflow-y-auto">
                  <StepContent />
                </div>
                <div className="shrink-0 z-[9999]">
                  <FooterActions />
                </div>
              </div>
            </div>
            <GradientBar position="bottom" />
            <GlobalLayersviewWindow />
            <GlobalShortcutsWindow />
            <GlobalRulesWindow />
          </div>
        </DraggableHeader>
      ) : (
        <AnimationOverlay />
      )}
    </>
  );
};

Layout.displayName = 'Layout';

export default Layout;
