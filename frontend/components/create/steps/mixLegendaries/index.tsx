import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import { useProjectSetup } from '@/components/store/projectSetup/hook';
import { useLegendaryNFTStore } from '@/components/store/legendary';

import StepWrapper from '@/components/heading/StepWrapper';
import { FolderDisplay } from '@/components/shared/FolderDisplay';

import { CheckTrueIcon, FolderIcon, AttentionIcon, InfoIcon } from '@/components/icons';

const LegendaryNFTMixer: React.FC = () => {
  const { exportFolder: projectExportFolder } = useProjectSetup();
  const {
    legendaryFolder,
    exportFolder,
    errorMessage,
    showContent,
    isMixComplete,
    setShowContent,
    initExportFolder,
    selectLegendaryFolder,
    selectExportFolder,
  } = useLegendaryNFTStore();

  useEffect(() => {
    setShowContent(true);
    void initExportFolder('', projectExportFolder);
  }, [projectExportFolder, initExportFolder, setShowContent]);

  const transitionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
  };

  return (
    <StepWrapper headerTitle="Mix Legendary NFTs">
      <div className="grow flex flex-col justify-between">
        <div>
          {showContent && (
            <div>
              <div className="grow">
                {showContent && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 mb-2">
                    <div className="p-2 rounded-sm shadow-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                      <div className="relative">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-md sm:text-lg font-semibold text-[rgb(var(--color-primary))]">
                            Input
                          </div>
                          <div className="hidden text-sm italic sm:flex items-center text-gray-500 dark:text-gray-400">
                            <InfoIcon className="w-5 h-5 mr-2" />
                            Select legendary NFTs
                          </div>
                        </div>

                        <div className="space-y-4">
                          <button
                            onClick={() => void selectLegendaryFolder()}
                            className="w-full bg-gradient-to-r from-[rgb(var(--color-primary))] to-[rgb(var(--color-secondary))] hover:from-[rgb(var(--color-primary-dark))] hover:to-[rgb(var(--color-secondary-dark))] text-white font-medium px-4 h-10 rounded-sm transition-colors duration-300 ease-in-out focus:outline-none flex items-center justify-center space-x-2"
                            style={{
                              boxShadow:
                                'inset 0 1px 0 0 rgba(255,255,255,0.4), inset 0 -2px 2px rgba(0,0,0,0.2), inset -2px 0 2px rgba(0,0,0,0.2), 0 1px 3px rgba(0,0,0,0.2)',
                              border: '1px solid rgb(var(--color-primary))',
                              textShadow: '0 -1px 0 rgba(0,0,0,0.2)',
                            }}
                          >
                            <FolderIcon className="w-5 h-5" />
                            <span>Select Legendary NFTs Folder</span>
                          </button>

                          {legendaryFolder && (
                            <div className="animate-fadeIn">
                              <FolderDisplay label="Legendary NFTs folder" path={legendaryFolder} />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="p-2 rounded-sm shadow-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                      <div className="relative">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-md sm:text-lg font-semibold text-[rgb(var(--color-primary))]">
                            Output
                          </div>
                          <div className="hidden text-sm italic sm:flex items-center text-gray-500 dark:text-gray-400">
                            <InfoIcon className="w-5 h-5 mr-2" />
                            Choose export location
                          </div>
                        </div>

                        <div className="space-y-4">
                          <button
                            onClick={() => void selectExportFolder()}
                            className="w-full bg-gradient-to-r from-[rgb(var(--color-primary))] to-[rgb(var(--color-secondary))] hover:from-[rgb(var(--color-primary-dark))] hover:to-[rgb(var(--color-secondary-dark))] text-white font-medium px-4 h-10 rounded-sm transition-colors duration-300 ease-in-out focus:outline-none flex items-center justify-center space-x-2"
                            style={{
                              boxShadow:
                                'inset 0 1px 0 0 rgba(255,255,255,0.4), inset 0 -2px 2px rgba(0,0,0,0.2), inset -2px 0 2px rgba(0,0,0,0.2), 0 1px 3px rgba(0,0,0,0.2)',
                              border: '1px solid rgb(var(--color-primary))',
                              textShadow: '0 -1px 0 rgba(0,0,0,0.2)',
                            }}
                          >
                            <FolderIcon className="w-5 h-5" />
                            <span>Select Export Folder</span>
                          </button>

                          {exportFolder && (
                            <div className="animate-fadeIn">
                              <FolderDisplay label="Export folder" path={exportFolder} />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              {errorMessage && (
                <AnimatePresence>
                  <motion.div
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    variants={transitionVariants}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className="mt-4 p-3 bg-[rgb(var(--color-quaternary)/0.1)] border border-[rgb(var(--color-quaternary))] text-[rgb(var(--color-quaternary))] rounded"
                  >
                    {errorMessage}
                  </motion.div>
                </AnimatePresence>
              )}

              {isMixComplete && (
                <AnimatePresence>
                  <motion.div
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    variants={transitionVariants}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className="mt-8 p-3 bg-[rgb(var(--color-quinary)/0.1)] border border-[rgb(var(--color-quinary))] text-[rgb(var(--color-quinary))] rounded flex items-center"
                  >
                    <CheckTrueIcon className="w-6 h-6 text-[rgb(var(--color-quinary))] mr-2" />
                    <span>Legendary NFTs have been successfully mixed with your collection.</span>
                  </motion.div>
                </AnimatePresence>
              )}
            </div>
          )}
        </div>
        {!legendaryFolder && (
          <div className="mt-8 p-3 rounded-sm flex items-center space-x-3 bg-yellow-100 dark:bg-yellow-200 border border-yellow-200 dark:border-yellow-300 text-yellow-700 dark:text-yellow-800">
            <AttentionIcon className="w-6 h-6 shrink-0" />
            <span className="text-sm sm:text-base grow">
              Please select your Legendary NFTs folder to proceed.
            </span>
          </div>
        )}
      </div>
    </StepWrapper>
  );
};

export default LegendaryNFTMixer;
