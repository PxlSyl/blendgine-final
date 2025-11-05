import React from 'react';
import DraggableHeader from '@/components/shared/DraggableHeader';
import AppHeader from '@/components/heading/header/AppHeader';

interface GenerationStateLayoutProps {
  children: React.ReactNode;
}

export const GenerationStateLayout: React.FC<GenerationStateLayoutProps> = ({ children }) => {
  return (
    <div className="h-screen flex flex-col font-sans">
      <DraggableHeader>
        <div className="relative w-full h-full grow overflow-hidden">
          <div className="absolute inset-0 p-[4px] rounded-bl-lg rounded-br-lg shimmer-border">
            <div className="w-full h-full rounded-lg overflow-hidden">
              <div className="w-full h-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white flex flex-col relative shadow-xl">
                <div className="sticky top-0 z-50 bg-inherit">
                  <AppHeader />
                </div>
                <div className="flex-1 overflow-auto">{children}</div>
              </div>
            </div>
          </div>
        </div>
      </DraggableHeader>
    </div>
  );
};
