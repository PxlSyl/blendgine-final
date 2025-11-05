import React, { useCallback } from 'react';

import { useStore } from '@/components/store';

import ProjectSetup from '@/components/create/steps/ProjectSetup';
import LayerOrder from '@/components/create/steps/LayerOrder';
import RarityConfig from '@/components/create/steps/RarityConfig';
import Generation from '@/components/create/steps/GenerationSettings';
import TintAndFilterSetup from '@/components/create/steps/FiltersSetup';
import LegendaryNFTMixer from '@/components/create/steps/mixLegendaries';
import MetadataStepContent from '@/components/manage/heading/MetadataStepContent';

const StepContent: React.FC = () => {
  const step = useStore((state) => state.step);
  const activeSection = useStore((state) => state.activeSection);

  const renderStepComponent = useCallback((stepNumber: number) => {
    switch (stepNumber) {
      case 1:
        return <ProjectSetup />;
      case 2:
        return <LayerOrder />;
      case 3:
        return <RarityConfig />;
      case 4:
        return <Generation />;
      case 5:
        return <TintAndFilterSetup />;
      case 6:
        return <LegendaryNFTMixer />;
      default:
        return null;
    }
  }, []);

  return (
    <div className="flex-1 pt-2">
      {activeSection === 'manage' && <MetadataStepContent />}
      {activeSection === 'create' && renderStepComponent(step)}
    </div>
  );
};

export default React.memo(StepContent);
