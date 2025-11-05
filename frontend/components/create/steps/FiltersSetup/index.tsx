import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { FilterInstance, FilterName } from '@/types/effect';

import {
  AttentionIcon,
  PlusCircleIcon,
  TrashIcon,
  ExpandIcon,
  CollapseIcon,
} from '@/components/icons';
import { FolderDisplay } from '@/components/shared/FolderDisplay';
import StepWrapper from '@/components/heading/StepWrapper';
import { ActionButton } from '@/components/shared/ActionButton';
import Dropdown from '@/components/shared/Dropdown';
import Toggle from '@/components/shared/Toggle';

import FilterControl from './Filters/FilterControls';
import AddFilterModal from './Filters/addFilterModal';
import FlipOptions from './FlipFlop/FlipFlopOptions';
import PreviewCanvas from './Canvas';
import PipelineSelector from './PipelineSelector';

import { useFiltersSetup } from './hooks';
import { MAX_FILTERS } from './constants';

const TintAndFilterSetup: React.FC = () => {
  const {
    tintingOptions,
    flipOptions,
    sourceFolder,
    destinationFolder,
    exportFormat,
    isAnimated,
    expandedFilters,
    isAddFilterModalOpen,
    sourceFolderError,
    destinationFolderError,
    exportFormats,
    isToggleEnabled,
    transitionVariants,

    addFilter,
    updateFilter,
    toggleFilter,
    removeFilter,
    removeAllFilters,
    setIsAnimated,
    toggleFilterExpansion,
    setIsAddFilterModalOpen,

    handleSourceFolderSelect,
    handleDestinationFolderSelect,
    handleExpandAllFilters,
    handleCollapseAllFilters,
    handleDragEnd,
    handleExportFormatChange,

    areFiltersActive,
    getActiveEffects,
    getAllEffects,
    canAddMoreFilters,
    hasFiltersToExpand,
  } = useFiltersSetup();

  const previewCanvasRef = React.useRef<{ generatePreview: () => Promise<void> }>(null);

  return (
    <StepWrapper headerTitle="Filtering">
      <div className="grow">
        <AnimatePresence>
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
              <motion.div
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={transitionVariants}
                className="min-h-[400px] lg:min-h-[600px] lg:sticky lg:top-4"
              >
                <PreviewCanvas
                  ref={previewCanvasRef}
                  filters={getActiveEffects()}
                  flipOptions={
                    flipOptions || { horizontalFlipPercentage: 0, verticalFlipPercentage: 0 }
                  }
                />
              </motion.div>

              <div className="space-y-1">
                <motion.div
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  variants={transitionVariants}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                >
                  <div>
                    <div className="mb-2">
                      <motion.div
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        variants={transitionVariants}
                        className="p-2 rounded-sm shadow-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                      >
                        <div className="relative">
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                onClick={() => void handleSourceFolderSelect()}
                                className="w-full bg-gradient-to-r from-[rgb(var(--color-primary))] to-[rgb(var(--color-secondary))] hover:from-[rgb(var(--color-primary-dark))] hover:to-[rgb(var(--color-secondary-dark))] text-white font-medium px-4 h-10 rounded-sm transition-colors duration-300 ease-in-out focus:outline-none flex items-center justify-center space-x-2"
                                style={{
                                  boxShadow:
                                    'inset 0 1px 0 0 rgba(255,255,255,0.4), inset 0 -2px 2px rgba(0,0,0,0.2), inset -2px 0 2px rgba(0,0,0,0.2), 0 1px 3px rgba(0,0,0,0.2)',
                                  border: '1px solid rgb(var(--color-primary))',
                                  textShadow: '0 -1px 0 rgba(0,0,0,0.2)',
                                }}
                              >
                                <svg
                                  className="w-5 h-5"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                                  />
                                </svg>
                                <span>Select Source Folder</span>
                              </button>

                              <button
                                onClick={() => void handleDestinationFolderSelect()}
                                className="w-full bg-gradient-to-r from-[rgb(var(--color-primary))] to-[rgb(var(--color-secondary))] hover:from-[rgb(var(--color-primary-dark))] hover:to-[rgb(var(--color-secondary-dark))] text-white font-medium px-4 h-10 rounded-sm transition-colors duration-300 ease-in-out focus:outline-none flex items-center justify-center space-x-2"
                                style={{
                                  boxShadow:
                                    'inset 0 1px 0 0 rgba(255,255,255,0.4), inset 0 -2px 2px rgba(0,0,0,0.2), inset -2px 0 2px rgba(0,0,0,0.2), 0 1px 3px rgba(0,0,0,0.2)',
                                  border: '1px solid rgb(var(--color-primary))',
                                  textShadow: '0 -1px 0 rgba(0,0,0,0.2)',
                                }}
                              >
                                <svg
                                  className="w-5 h-5"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                                  />
                                </svg>
                                <span>Select Destination Folder</span>
                              </button>
                            </div>

                            <div className="space-y-2">
                              {sourceFolder && (
                                <div className="animate-fadeIn">
                                  <FolderDisplay label="Source folder" path={sourceFolder} />
                                </div>
                              )}

                              {destinationFolder && (
                                <div className="animate-fadeIn">
                                  <FolderDisplay
                                    label="Destination folder"
                                    path={`${destinationFolder}/collection with filters`}
                                  />
                                </div>
                              )}

                              {sourceFolderError && (
                                <motion.div
                                  initial="hidden"
                                  animate="visible"
                                  exit="exit"
                                  variants={transitionVariants}
                                  transition={{ duration: 0.3, ease: 'easeOut' }}
                                  className="p-3 bg-[rgb(var(--color-quaternary)/0.1)] border border-[rgb(var(--color-quaternary))] text-[rgb(var(--color-quaternary))] rounded-sm"
                                >
                                  {sourceFolderError}
                                </motion.div>
                              )}

                              {destinationFolderError && (
                                <motion.div
                                  initial="hidden"
                                  animate="visible"
                                  exit="exit"
                                  variants={transitionVariants}
                                  transition={{ duration: 0.3, ease: 'easeOut' }}
                                  className="p-3 bg-[rgb(var(--color-quaternary)/0.1)] border border-[rgb(var(--color-quaternary))] text-[rgb(var(--color-quaternary))] rounded-sm"
                                >
                                  {destinationFolderError}
                                </motion.div>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </div>

                    <div className="mt-2 p-2 rounded-sm shadow-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 max-h-[600px] overflow-y-auto">
                      <div className="mb-4">
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-1">
                            <div className="text-md sm:text-lg font-semibold text-[rgb(var(--color-primary))]">
                              Select export format
                            </div>
                            <div className="flex items-center space-x-2">
                              <span
                                className={`text-sm font-medium ${isToggleEnabled ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500'}`}
                              >
                                Animated?
                              </span>
                              <Toggle
                                checked={isAnimated}
                                onChange={() => setIsAnimated(!isAnimated)}
                                disabled={!isToggleEnabled}
                                size="md"
                                activeColor="bg-[rgb(var(--color-primary))]"
                                inactiveColor="bg-gray-200 dark:bg-gray-700"
                                thumbColor="bg-white"
                              />
                            </div>
                          </div>
                          <Dropdown
                            options={exportFormats}
                            value={exportFormat}
                            placeholder="Select format"
                            onChange={handleExportFormatChange}
                            textColorClass="text-gray-500 dark:text-gray-400"
                            selectedColor="purple"
                            renderOption={(option) => option.toUpperCase()}
                            renderValue={(value) => value.toUpperCase()}
                          />
                        </div>
                        <FlipOptions />
                      </div>

                      <div className="mb-6">
                        <PipelineSelector />
                      </div>

                      <div className="ml-4 mb-2 text-md sm:text-lg font-semibold text-[rgb(var(--color-primary))] mt-6">
                        <div className="flex items-center justify-between">
                          <span>Filters</span>
                          <div className="flex space-x-2">
                            {hasFiltersToExpand() && (
                              <>
                                <ActionButton
                                  onClick={handleExpandAllFilters}
                                  label="Expand All"
                                  description="Expand all filters to show their configuration options"
                                  color="purple"
                                  icon={ExpandIcon}
                                />
                                <ActionButton
                                  onClick={handleCollapseAllFilters}
                                  label="Collapse All"
                                  description="Collapse all filters to hide their configuration options"
                                  color="pink"
                                  icon={CollapseIcon}
                                />
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <motion.div
                        key={`filters-container-${tintingOptions.activePipelineId}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{
                          type: 'spring',
                          stiffness: 300,
                          damping: 30,
                          duration: 0.4,
                          ease: 'easeInOut',
                        }}
                      >
                        <AnimatePresence initial={false} mode="wait">
                          <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                            <SortableContext
                              items={getAllEffects().map((effect) => effect.id)}
                              strategy={verticalListSortingStrategy}
                            >
                              <motion.div
                                key={tintingOptions.activePipelineId}
                                layout
                                transition={{
                                  layout: {
                                    type: 'spring',
                                    stiffness: 500,
                                    damping: 50,
                                    mass: 1,
                                    duration: 0.3,
                                    ease: 'easeInOut',
                                  },
                                  opacity: {
                                    duration: 0.2,
                                    ease: 'easeInOut',
                                  },
                                }}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                              >
                                {getAllEffects().map((filter: FilterInstance) => (
                                  <FilterControl
                                    key={filter.id}
                                    filterName={filter.filterType}
                                    filter={filter}
                                    updateFilter={(filterId, updates) =>
                                      updateFilter(filterId, updates)
                                    }
                                    onToggleFilter={() => toggleFilter(filter.id)}
                                    onRemoveFilter={() => removeFilter(filter.id)}
                                    isExpanded={expandedFilters.has(filter.id)}
                                    onToggleExpansion={() => {
                                      toggleFilterExpansion(filter.id);
                                    }}
                                    isAnimated={isAnimated}
                                  />
                                ))}
                              </motion.div>
                            </SortableContext>
                          </DndContext>
                        </AnimatePresence>
                      </motion.div>
                      <motion.div
                        key={`filters-actions-${tintingOptions.activePipelineId}`}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          type: 'spring',
                          stiffness: 300,
                          damping: 30,
                          duration: 0.35,
                          ease: 'easeInOut',
                        }}
                        className="flex justify-between items-center mt-4"
                      >
                        <div className="flex space-x-2">
                          {canAddMoreFilters() && (
                            <ActionButton
                              onClick={() => setIsAddFilterModalOpen(true)}
                              label="Add New Filter"
                              description="Add a new filter to the current pipeline"
                              color="purple"
                              icon={PlusCircleIcon}
                            />
                          )}
                          {getAllEffects().length > 0 && (
                            <ActionButton
                              onClick={removeAllFilters}
                              label="Remove All Filters"
                              description="Remove all filters from the current pipeline"
                              color="red"
                              icon={TrashIcon}
                            />
                          )}
                        </div>
                      </motion.div>
                      {!areFiltersActive() && (
                        <div className="mt-4 p-3 rounded flex items-center space-x-3 bg-yellow-100 dark:bg-yellow-200 border border-yellow-200 dark:border-yellow-300 text-yellow-700 dark:text-yellow-800">
                          <AttentionIcon className="w-6 h-6 shrink-0" />
                          <span className="text-sm sm:text-base grow">
                            Please activate at least one filter or flip option to proceed.
                          </span>
                        </div>
                      )}
                      {!canAddMoreFilters() && (
                        <div className="mt-4 p-3 rounded flex items-center space-x-3 bg-red-100 dark:bg-red-200 border border-red-200 dark:border-yellow-300 text-yellow-700 dark:text-yellow-800">
                          <AttentionIcon className="w-6 h-6 shrink-0" />
                          <span className="text-sm sm:text-base grow">
                            Maximum number of filters ({MAX_FILTERS}) reached for this pipeline.
                            Remove a filter to add a new one.
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </>
        </AnimatePresence>
        <AddFilterModal
          isOpen={isAddFilterModalOpen}
          onClose={() => setIsAddFilterModalOpen(false)}
          onAddFilter={(filterType: FilterName) => addFilter(filterType)}
        />
      </div>
    </StepWrapper>
  );
};

export default TintAndFilterSetup;
