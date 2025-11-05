import React, { useEffect, useMemo, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import { useGenerationSettingsStore } from '@/components/store/generationsettings';
import { useLayerOrder } from '@/components/store/layerOrder/hook';
import { useProjectSetup } from '@/components/store/projectSetup/hook';

import { AttentionIcon } from '@/components/icons';
import StepWrapper from '@/components/heading/StepWrapper';
import { OutputSection } from './components/OutputSection';
import { CollectionInfo } from './components/CollectionInfo';
import { FormatSelector } from './components/FormatSelector';
import { BlockchainSelector } from './components/BlockchainSelector';
import { SolanaConfig } from './components/SolanaConfig';
import { ImageDimensions } from './components/ImageDimensions';
import { GenerationOptions } from './components/GenerationOptions';
import GameMetadataConfig from './components/GameMetadataConfig';
import { ArtworkCounts } from './components/ArtworkCounts';
import AnimationSettings from './components/AnimationSettings';
import ResizeSettings from './components/ResizeSettings';

const GenerationSetup: React.FC = () => {
  const { sets, getTotalNFTCount } = useLayerOrder();
  const generationSettingsStore = useGenerationSettingsStore();
  const { errorMessage, validateAndPrepareGeneration, updateResizeConfig, loadPersistedState } =
    generationSettingsStore;

  const { resizeConfig } = generationSettingsStore;
  const generationStore = useMemo(
    () => ({
      blockchain: generationSettingsStore.blockchain,
      blockchains: generationSettingsStore.blockchains,
      selectBlockchain: generationSettingsStore.selectBlockchain,
      finalWidth: generationSettingsStore.finalWidth,
      finalHeight: generationSettingsStore.finalHeight,
      getMaxImageSize: generationSettingsStore.getMaxImageSize,
      updateFormats: generationSettingsStore.updateFormats,
      fixedProportion: generationSettingsStore.fixedProportion,
      MIN_IMAGE_SIZE: generationSettingsStore.MIN_IMAGE_SIZE,
      handleWidthChange: generationSettingsStore.handleWidthChange,
      handleHeightChange: generationSettingsStore.handleHeightChange,
      setFixedProportion: generationSettingsStore.setFixedProportion,
      getSliderPercentage: generationSettingsStore.getSliderPercentage,
      shuffleSets: generationSettingsStore.shuffleSets,
      allowDuplicates: generationSettingsStore.allowDuplicates,
      setShuffleSets: generationSettingsStore.setShuffleSets,
      setAllowDuplicates: generationSettingsStore.setAllowDuplicates,
    }),
    [generationSettingsStore]
  );

  const {
    collectionName,
    collectionDescription,
    exportFolder,
    includeRarity,
    isAnimatedCollection,
    handleCollectionNameChange,
    handleCollectionDescriptionChange,
    handleSelectExportFolder,
    setIncludeRarity,
  } = useProjectSetup();

  useEffect(() => {
    void loadPersistedState();
  }, [loadPersistedState]);

  useEffect(() => {
    validateAndPrepareGeneration();
  }, [generationStore.finalWidth, generationStore.finalHeight, validateAndPrepareGeneration]);

  const updateFormatsRef = useRef(generationStore.updateFormats);
  updateFormatsRef.current = generationStore.updateFormats;

  useEffect(() => {
    updateFormatsRef.current();
  }, [isAnimatedCollection]);

  const transitionVariants = useMemo(
    () => ({
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: 20 },
    }),
    []
  );

  return (
    <StepWrapper headerTitle="Generation">
      <OutputSection
        exportFolder={exportFolder}
        handleSelectExportFolder={() => void handleSelectExportFolder()}
      />

      <CollectionInfo
        collectionName={collectionName}
        collectionDescription={collectionDescription}
        includeRarity={includeRarity}
        handleCollectionNameChange={handleCollectionNameChange}
        handleCollectionDescriptionChange={handleCollectionDescriptionChange}
        setIncludeRarity={setIncludeRarity}
        transitionVariants={transitionVariants}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 mb-2">
        <FormatSelector transitionVariants={transitionVariants} />

        <BlockchainSelector
          blockchain={generationStore.blockchain}
          blockchains={[...generationStore.blockchains]}
          selectBlockchain={generationStore.selectBlockchain}
          transitionVariants={transitionVariants}
        />
      </div>

      {generationStore.blockchain === 'sol' && (
        <AnimatePresence>
          <motion.div
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={transitionVariants}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="mb-4"
          >
            <SolanaConfig />
          </motion.div>
        </AnimatePresence>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 mb-2">
        {isAnimatedCollection && (
          <AnimatePresence>
            <motion.div
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={transitionVariants}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="lg:col-span-3"
            >
              <AnimationSettings transitionVariants={transitionVariants} />
            </motion.div>
          </AnimatePresence>
        )}

        <ImageDimensions
          {...generationStore}
          MAX_IMAGE_SIZE={generationStore.getMaxImageSize()}
          transitionVariants={transitionVariants}
        />
        <GenerationOptions {...generationStore} transitionVariants={transitionVariants} />
      </div>

      {resizeConfig && (
        <AnimatePresence>
          <motion.div
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={transitionVariants}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <ResizeSettings
              resizeConfig={resizeConfig}
              updateResizeConfig={updateResizeConfig}
              transitionVariants={transitionVariants}
            />
          </motion.div>
        </AnimatePresence>
      )}
      <GameMetadataConfig />

      <ArtworkCounts
        sets={sets}
        totalArtworks={getTotalNFTCount()}
        transitionVariants={transitionVariants}
      />

      {errorMessage && (
        <div className="mt-8 p-3 rounded flex items-center space-x-3 bg-[rgb(var(--color-quaternary)/0.1)] dark:bg-[rgb(var(--color-quaternary)/0.2)] border border-[rgb(var(--color-quaternary))] dark:border-[rgb(var(--color-quaternary)/0.3)] text-[rgb(var(--color-quaternary))] dark:text-[rgb(var(--color-quaternary-dark))]">
          <AttentionIcon className="w-6 h-6 shrink-0" />
          <span className="text-sm sm:text-base grow">{errorMessage}</span>
        </div>
      )}
    </StepWrapper>
  );
};

export default React.memo(GenerationSetup);
