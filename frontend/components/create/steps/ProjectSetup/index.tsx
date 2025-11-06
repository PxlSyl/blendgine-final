import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { listen } from '@tauri-apps/api/event';

import { useProjectSetup } from '@/components/store/projectSetup/hook';

import StepWrapper from '@/components/heading/StepWrapper';
import LayerPreview from './Medias';
import FolderStructure from './FolderStucture';
import InputSection from './InputSection';
import { InfoIcon } from '@/components/icons';
import { LoadingSpinner } from './LoadingSpinner';

const TRANSITION_VARIANTS = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 20, scale: 0.95 },
} as const;

const ProjectSetup: React.FC = () => {
  const { selectedFolder, errorMessage, layerImages, setLayerImages } = useProjectSetup();
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [showContent, setShowContent] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const processingListenerPromise = listen<{ status: string }>(
      'folder_processing_started',
      (event) => {
        if (!cancelled && event.payload.status === 'started') {
          setIsLoading(true);
          setProgress(0);
          setStatus('Initializing...');
          setShowContent(false);
          setLayerImages([]);
        }
      }
    );

    const progressListenerPromise = listen<{ progress: number; status: string }>(
      'processing_progress',
      (event) => {
        if (!cancelled) {
          setProgress(event.payload.progress);
          setStatus(event.payload.status);

          if (event.payload.progress >= 70 && !showContent) {
            setShowContent(true);
          }
        }
      }
    );

    return () => {
      cancelled = true;
      processingListenerPromise
        .then((processingListener) => {
          if (!cancelled && typeof processingListener === 'function') {
            processingListener();
          }
        })
        .catch(() => {
          // Silent fail for race conditions
        });
      progressListenerPromise
        .then((progressListener) => {
          if (!cancelled && typeof progressListener === 'function') {
            progressListener();
          }
        })
        .catch(() => {
          // Silent fail for race conditions
        });
    };
  }, [setLayerImages, showContent]);

  useEffect(() => {
    if (layerImages.length > 0) {
      setIsLoading(false);
      setProgress(0);
      setStatus('');
      setShowContent(true);
    }
  }, [layerImages]);

  return (
    <StepWrapper headerTitle="Project Setup">
      <div className="flex flex-col h-[calc(100vh-8rem)] space-y-1">
        <div className="shrink-0">
          <InputSection
            selectedFolder={selectedFolder}
            isLoading={isLoading}
            progress={progress}
            status={status}
          />
        </div>

        <div className="flex flex-col md:flex-row gap-2 flex-1 min-h-0">
          <motion.div
            className="w-full md:w-2/5 p-2 rounded-sm shadow-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex flex-col min-h-[300px] md:min-h-0"
            animate={{ opacity: showContent ? 1 : 0.5 }}
            transition={{ duration: 0.3 }}
          >
            <div className="text-md sm:text-lg font-semibold mb-2 text-[rgb(var(--color-primary))] shrink-0">
              Folders
            </div>
            <div className="flex-1 overflow-auto relative">
              {isLoading ? (
                <LoadingSpinner progress={progress} status={status} />
              ) : !selectedFolder ? (
                <div className="h-full flex items-center justify-center">
                  <div className="px-2 py-1 sm:text-base text-sm rounded-sm bg-[rgb(var(--color-secondary)/0.1)] text-[rgb(var(--color-secondary))]">
                    Choose a folder to get started.
                  </div>
                </div>
              ) : (
                <AnimatePresence mode="wait">
                  <motion.div
                    key="folder-structure"
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    variants={TRANSITION_VARIANTS}
                  >
                    <FolderStructure />
                  </motion.div>
                </AnimatePresence>
              )}
            </div>
          </motion.div>

          <motion.div
            className="w-full md:w-3/5 p-2 rounded-sm shadow-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex flex-col min-h-[300px] md:min-h-0"
            animate={{ opacity: showContent ? 1 : 0.5 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex justify-between items-center mb-2 shrink-0">
              <div className="text-md sm:text-lg font-semibold text-[rgb(var(--color-primary))]">
                Medias
              </div>
            </div>
            <div className="flex-1 min-h-0 relative">
              {isLoading ? (
                <LoadingSpinner progress={progress} status={status} />
              ) : !selectedFolder ? (
                <div className="h-full flex items-center justify-center">
                  <div className="hidden sm:flex text-sm italic items-center text-gray-500 dark:text-gray-400">
                    <InfoIcon className="w-5 h-5 mr-2" />
                    Supported formats: .png, .webp, .gif, .mp4, .webm, .mov, .avi, .mkv
                  </div>
                </div>
              ) : (
                <div className="h-full overflow-auto">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key="layer-preview"
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      variants={TRANSITION_VARIANTS}
                      transition={{ duration: 0.2, ease: 'easeOut', delay: 0.2 }}
                      className="h-full"
                    >
                      <LayerPreview />
                    </motion.div>
                  </AnimatePresence>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {errorMessage && (
          <AnimatePresence>
            <motion.div
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={TRANSITION_VARIANTS}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="p-3 bg-[rgb(var(--color-quaternary)/0.1)] border border-[rgb(var(--color-quaternary))] text-[rgb(var(--color-quaternary))] rounded-sm shrink-0 sm:text-base text-sm"
            >
              {errorMessage}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </StepWrapper>
  );
};

export default React.memo(ProjectSetup);
