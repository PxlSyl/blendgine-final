import React from 'react';

import StepHeader from './StepHeader';

interface StepWrapperProps {
  children: React.ReactNode;
  headerTitle: string;
  headerClassName?: string;
}

const StepWrapper = React.memo<StepWrapperProps>(({ children, headerTitle, headerClassName }) => {
  return (
    <div className="flex flex-col h-full">
      <div className="bg-inherit">
        <StepHeader title={headerTitle} className={`px-2 ${headerClassName}`} />
      </div>
      <div className="flex-1">
        <div className="px-2">{children}</div>
      </div>
    </div>
  );
});

StepWrapper.displayName = 'StepWrapper';

export default StepWrapper;
