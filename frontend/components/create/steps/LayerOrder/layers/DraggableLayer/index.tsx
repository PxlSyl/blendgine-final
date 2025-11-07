import React, { memo, useCallback, type CSSProperties } from 'react';
import { motion } from 'framer-motion';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { DEFAULT_BLEND_PROPERTIES } from '@/types/blendModes';

import { capitalize, removeFileExtension } from '@/utils/functionsUtils';
import {
  ChevronDownIcon,
  DragIcon,
  RestoreIcon,
  TrashIcon,
  CrossIcon,
  FolderIcon,
  EyeOpenIcon,
  EyeClosedIcon,
  MixIcon,
  MoveIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CheckIcon,
} from '@/components/icons';
import { Tooltip } from '@/components/shared/ToolTip';
import BlendModeModal from '../BlendModals/UniqueBlend';
import LayerBlendModal from '../BlendModals/LayerBlend';
import ImageTypeIcon from '@/components/shared/ImageTypeIcon';
import { invoke } from '@tauri-apps/api/core';

import { useDraggableLayer } from './hooks/useDraggableLayer';
import SmallNumericStepper from '@/components/shared/SmallNumericStepper';
import { useLayerOrder } from '@/components/store/layerOrder/hook';
import { useProjectSetup } from '@/components/store/projectSetup/hook';

interface DraggableLayerProps {
  layer: string;
  index: number;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  isLastLayer: boolean;
  imageInfos?: ReadonlyArray<{
    readonly name: string;
    readonly frame_count?: number;
    readonly is_single_frame?: boolean;
  }>;
}

const DraggableLayer: React.FC<DraggableLayerProps> = ({
  layer,
  index,
  onMoveUp,
  onMoveDown,
  isLastLayer,
  imageInfos,
}) => {
  const {
    activeSetId,
    isLayerActive,
    getOrderedLayers,
    viewMode,
    rarityConfig,
    expandedLayers,
    forcedTraits,
    sets,
    updateRarityConfig,
    saveRarityConfig,
    saveState,
    toggleLayerExpansion: toggleLayerExpansionAction,
    toggleLayerDisabled,
    toggleTraitDisabled,
    forceTraitPreview,
    triggerGeneration,
    isGenerating,
  } = useLayerOrder();
  const { selectedFolder } = useProjectSetup();
  const currentSetId = activeSetId ?? 'set1';
  const {
    isExpanded,
    isDisabled,
    traits,
    isFirstLayer,
    isBlendSelectorOpen,
    showTooltip,
    setShowTooltip,
    isLayerBlendOpen,
    blendSelectorRef,
    forcedTraits: hookForcedTraits,
    getColorForKey,
    handleToggleDisable,
    handleToggleTraitDisable,
    isTraitEnabled,
    handleZIndexChange,
    handlePreviewTrait,
    toggleBlendSelector,
    getBlendIconColor,
    handleMouseEnter,
    handleMouseLeave,
    getTraitSetConfig,
    setIsLayerBlendOpen,
    setIsBlendSelectorOpen,
    toggleLayerExpansion,
    isLayerIncludedInMetadata,
    isTraitIncludedInMetadata,
    toggleLayerMetadataInclusion,
    toggleTraitMetadataInclusion,
  } = useDraggableLayer(layer, {
    rarityConfig,
    expandedLayers,
    forcedTraits,
    sets,
    activeSetId,
    updateRarityConfig,
    saveRarityConfig,
    saveState,
    toggleLayerExpansion: toggleLayerExpansionAction,
    toggleLayerDisabled,
    toggleTraitDisabled,
    forceTraitPreview,
    triggerGeneration,
    isGenerating,
  });

  const traitNamesKey = Object.keys(traits).sort().join('|');

  const handleOpenOffsetWindow = useCallback(
    (traitName: string) => {
      const setConfig = rarityConfig[layer]?.traits?.[traitName]?.sets?.[currentSetId];
      const offsetX = setConfig?.offsetX ?? 0;
      const offsetY = setConfig?.offsetY ?? 0;

      // Get image URL for preview (from selectedFolder + layer + traitName)
      const imageUrl = `asset://localhost/${selectedFolder}/${layer}/${traitName}`;

      void invoke('open_offset_window', {
        options: {
          layer,
          traitName,
          offsetX,
          offsetY,
          imageUrl,
        },
      });
    },
    [layer, rarityConfig, currentSetId, selectedFolder]
  );

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSorting,
  } = useSortable({
    id: layer,
    data: {
      index,
      type: 'layer',
    },
  });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(
      transform
        ? {
            ...transform,
            x: Math.min(Math.max(transform.x, -10), 10),
            y: transform.y,
            scaleX: transform.scaleX || 1,
            scaleY: transform.scaleY || 1,
          }
        : null
    ),
    transition,
    opacity: isSorting ? 0.4 : 1,
  };

  const baseStyle =
    'bg-white/90 dark:bg-gray-700/90 hover:bg-gray-50/95 dark:hover:bg-gray-600/95 rounded-sm py-1 px-1 flex items-center min-h-[36px] text-sm backdrop-blur-sm border border-gray-300 dark:border-gray-600/30';

  const baseStyleSmall = baseStyle.replace('py-1', 'py-0.5');
  const baseStyleTraitName = `${baseStyleSmall} justify-start w-full flex-1`;
  const orderedLayers = getOrderedLayers();
  const activeLayers = orderedLayers.filter((l) => isLayerActive(l));
  const activeIndex = activeLayers.indexOf(layer) + 1;
  const is3DView = viewMode === '3d';

  const getIconForTrait = (traitName: string) => {
    const icon = (
      <ImageTypeIcon
        imageInfos={imageInfos}
        itemName={traitName}
        className={`w-4 h-4 mr-2 ${isTraitEnabled(traitName) ? '' : 'text-[rgb(var(--color-primary))]'}`}
        style={{
          color: isTraitEnabled(traitName) ? getColorForKey(`${layer}-${traitName}`) : undefined,
        }}
      />
    );

    const possibleNames = [traitName, `${traitName}.webp`, `${traitName}.gif`, `${traitName}.png`];
    const imageInfo = imageInfos?.find((info) => possibleNames.includes(info.name));
    const fullName = imageInfo?.name ?? traitName;

    return { icon, fullName };
  };

  return (
    <div className="relative group mb-0.5">
      <div
        ref={setNodeRef}
        style={{
          ...style,
          position: 'relative',
          zIndex: isSorting ? 999 : 1,
        }}
      >
        <div className="flex flex-col w-full gap-0.5">
          <div className="flex flex-col xs:flex-row items-start xs:items-center w-full gap-0.5">
            <div className="flex items-center w-full gap-0.5">
              <div
                className={`
                    ${baseStyle}
                    ${isDisabled ? 'opacity-50' : ''}
                    ${isSorting ? 'shadow-lg ring-2 ring-[rgb(var(--color-primary)/0.5)]' : ''}
                  `}
              >
                <Tooltip tooltip={isExpanded ? 'Hide layers' : 'Show layers'}>
                  <div className="flex flex-row">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isDisabled) {
                          toggleLayerExpansion(layer);
                        }
                      }}
                      disabled={isDisabled}
                      className={`flex flex-row text-[rgb(var(--color-secondary))] dark:text-[rgb(var(--color-secondary-light))] ${
                        isDisabled
                          ? 'text-[rgb(var(--color-primary))] opacity-50 cursor-not-allowed'
                          : 'cursor-pointer'
                      }`}
                    >
                      <ChevronDownIcon
                        className={`hidden xs:block w-5 h-5 transform transition-transform duration-300 mr-2 ${isExpanded && !isDisabled ? '' : '-rotate-90'}`}
                      />
                      <span
                        className={`text-[rgb(var(--color-secondary))] dark:text-[rgb(var(--color-secondary-light))] xs:mr-2 ${isDisabled ? 'text-[rgb(var(--color-primary))] opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <FolderIcon className="w-5 h-5" />
                      </span>
                    </button>
                  </div>
                </Tooltip>
              </div>

              <div
                {...attributes}
                {...listeners}
                className={`
                    ${baseStyle}
                    ${isDisabled ? 'opacity-50' : ''}
                    ${isSorting ? 'shadow-lg ring-2 ring-[rgb(var(--color-primary)/0.5)]' : ''}
                    flex-1
                  `}
              >
                <div className="flex items-center text-[rgb(var(--color-secondary))] dark:text-[rgb(var(--color-secondary-light))] cursor-grab">
                  <span
                    className={`text-[rgb(var(--color-secondary))] dark:text-[rgb(var(--color-secondary-light))] mr-4 ${isDisabled ? 'text-[rgb(var(--color-primary))] opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <DragIcon className="w-4 h-4" />
                  </span>
                  {isDisabled ? (
                    <span className="text-lg text-[rgb(var(--color-primary))] dark:text-[rgb(var(--color-primary-light))]font-bold mr-2">
                      <CrossIcon className="w-4 h-4" />
                    </span>
                  ) : (
                    <span className="mr-2 text-xs sm:text-sm font-bold">{activeIndex}.</span>
                  )}
                  <div
                    className={`text-xs sm:text-sm font-bold ${isDisabled ? 'line-through text-[rgb(var(--color-primary))] dark:text-[rgb(var(--color-primary-light))]' : ''}`}
                  >
                    {capitalize(removeFileExtension(layer))}
                  </div>
                </div>
              </div>
            </div>

            <div
              className={`
                  ${baseStyle}
                  ${isDisabled ? 'opacity-50' : ''}
                  ${isSorting ? 'shadow-lg ring-2 ring-purple-500/50' : ''}
                  shrink-0
                `}
            >
              <Tooltip
                tooltip={`Metadata inclusion: ${isLayerIncludedInMetadata() ? 'Yes' : 'No'}`}
              >
                <button
                  onClick={() => void toggleLayerMetadataInclusion()}
                  disabled={isDisabled}
                  className={`flex items-center justify-center w-6 h-6 rounded-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 ${
                    isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                  } ${
                    isLayerIncludedInMetadata()
                      ? 'text-[rgb(var(--color-secondary))] hover:text-[rgb(var(--color-secondary-dark))] hover:bg-[rgb(var(--color-secondary)/0.1)] dark:hover:bg-[rgb(var(--color-secondary)/0.2)]'
                      : 'text-[rgb(var(--color-quaternary))] hover:text-[rgb(var(--color-quaternary-dark))] hover:bg-[rgb(var(--color-quaternary)/0.1)] dark:hover:bg-[rgb(var(--color-quaternary)/0.2)]'
                  }`}
                >
                  {isLayerIncludedInMetadata() ? (
                    <CheckIcon className="w-4 h-4" />
                  ) : (
                    <CrossIcon className="w-4 h-4" />
                  )}
                </button>
              </Tooltip>
            </div>

            <div
              className={`
                  ${baseStyle}
                  ${isDisabled ? 'opacity-50' : ''}
                  ${isSorting ? 'shadow-lg ring-2 ring-purple-500/50' : ''}
                  shrink-0
                `}
            >
              <Tooltip
                tooltip={
                  is3DView
                    ? 'Switch to 2D view to tweak blend modes'
                    : isFirstLayer
                      ? 'Blend options not available for first layer'
                      : 'Layer blend options'
                }
                forceHide={isFirstLayer || isDisabled}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isFirstLayer && !is3DView) {
                      setIsLayerBlendOpen(true);
                    }
                  }}
                  className={`flex items-center justify-center w-6 h-6 text-gray-400 hover:text-[rgb(var(--color-primary))]
                      ${
                        isFirstLayer || isDisabled || is3DView
                          ? 'text-gray-400 opacity-50 cursor-not-allowed'
                          : 'cursor-pointer'
                      }`}
                  disabled={isFirstLayer || isDisabled || is3DView}
                >
                  <MixIcon className="w-4 h-4" />
                </button>
              </Tooltip>
            </div>

            <div
              className={`
                  ${baseStyle}
                  ${isDisabled ? 'opacity-50' : ''}
                  ${isSorting ? 'shadow-lg ring-2 ring-purple-500/50' : ''}
                  shrink-0
                `}
            >
              <Tooltip tooltip="Move layer up" forceHide={index === 0 || isDisabled}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (index === 0 || isDisabled) {
                      return;
                    }
                    onMoveUp(index);
                  }}
                  disabled={index === 0 || isDisabled}
                  className={`flex items-center justify-center w-6 h-6 ${
                    index === 0 || isDisabled
                      ? 'text-gray-400 opacity-50 cursor-not-allowed'
                      : 'text-[rgb(var(--color-accent))] hover:text-[rgb(var(--color-accent-dark))] cursor-pointer'
                  } transition-colors duration-300`}
                >
                  <ArrowUpIcon className="w-4 h-4" />
                </button>
              </Tooltip>
            </div>

            <div
              className={`
                  ${baseStyle}
                  ${isDisabled ? 'opacity-50' : ''}
                  ${isSorting ? 'shadow-lg ring-2 ring-purple-500/50' : ''}
                  shrink-0
                `}
            >
              <Tooltip tooltip="Move layer down">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isLastLayer || isDisabled) {
                      return;
                    }
                    onMoveDown(index);
                  }}
                  disabled={isLastLayer || isDisabled}
                  className={`flex items-center justify-center w-6 h-6 ${
                    isLastLayer || isDisabled
                      ? 'text-gray-400 opacity-50 cursor-not-allowed'
                      : 'text-[rgb(var(--color-accent))] hover:text-[rgb(var(--color-accent-dark))] cursor-pointer'
                  } transition-colors duration-300`}
                >
                  <ArrowDownIcon className="w-4 h-4" />
                </button>
              </Tooltip>
            </div>

            <div
              className={`
                  ${baseStyle}
                  ${isDisabled ? 'opacity-50' : ''}
                  ${isSorting ? 'shadow-lg ring-2 ring-purple-500/50' : ''}
                  shrink-0
                `}
            >
              <Tooltip tooltip={isDisabled ? 'Enable folder' : 'Disable folder'}>
                <button
                  onClick={handleToggleDisable}
                  className={`flex items-center justify-center w-6 h-6 ${
                    isDisabled
                      ? 'text-[rgb(var(--color-primary))] hover:text-[rgb(var(--color-primary-dark))] cursor-pointer'
                      : 'text-[rgb(var(--color-quaternary))] hover:text-[rgb(var(--color-quaternary-dark))] cursor-pointer'
                  } transition-colors duration-300`}
                >
                  {isDisabled ? (
                    <RestoreIcon className="w-4 h-4" />
                  ) : (
                    <TrashIcon className="w-4 h-4" />
                  )}
                </button>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>

      <motion.div
        layout="size"
        initial={{ height: isExpanded ? 'auto' : 0, opacity: isExpanded ? 1 : 0 }}
        animate={{ height: isExpanded ? 'auto' : 0, opacity: isExpanded ? 1 : 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className={`overflow-hidden relative mt-0.5 bg-white dark:bg-gray-800 rounded-md shadow-md`}
      >
        <ul
          className={`mt-1 mb-1 sm:ml-4 list-none sm:pl-4 sm:border-l-2 sm:border-gray-300 sm:dark:border-gray-600`}
          key={`traits-list-${layer}-${traitNamesKey}`}
        >
          {Object.entries(traits)
            .filter(([traitName]) => traitName !== 'None')
            .sort(([traitNameA], [traitNameB]) => traitNameA.localeCompare(traitNameB))
            .map(([traitName, traitConfig]) => (
              <li
                key={traitName}
                className={`flex items-center justify-between text-sm text-gray-700 dark:text-gray-300 mb-1 relative`}
              >
                <span
                  className={`hidden sm:block absolute -left-4 top-1/2 transform -translate-y-1/2 w-4 h-0.5 bg-gray-300 dark:bg-gray-600`}
                ></span>
                <div
                  className={`flex flex-col xs:flex-row justify-between items-start xs:items-center w-full gap-0.5`}
                >
                  <div
                    className={`
                        ${baseStyleTraitName}
                        ${!isTraitEnabled(traitName) && 'opacity-50'}
                      `}
                  >
                    {getIconForTrait(traitName).icon}
                    <span
                      className={`text-xs ${isTraitEnabled(traitName) ? '' : 'line-through text-[rgb(var(--color-primary))]'}`}
                    >
                      {getIconForTrait(traitName).fullName}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-start gap-0.5">
                    <div
                      className={`
                          ${baseStyleSmall}
                          ${!isTraitEnabled(traitName) && 'opacity-50'}
                        `}
                    >
                      <Tooltip tooltip="Z-Index">
                        <div className="flex items-center">
                          <span className={`mr-1 text-xs text-gray-600 dark:text-gray-400`}>
                            Z-
                          </span>
                          <SmallNumericStepper
                            value={getTraitSetConfig(traitConfig).zIndex}
                            onChange={(newValue) => handleZIndexChange(layer, traitName, newValue)}
                            disabled={!isTraitEnabled(traitName)}
                          />
                        </div>
                      </Tooltip>
                    </div>

                    <div
                      className={`
                          ${baseStyleSmall}
                          ${!isTraitEnabled(traitName) && 'opacity-50'}
                        `}
                    >
                      <Tooltip
                        tooltip={
                          (hookForcedTraits[currentSetId]?.[layer] ?? '') === traitName
                            ? 'Disable preview'
                            : 'Preview this trait'
                        }
                      >
                        <button
                          onClick={() => handlePreviewTrait(traitName)}
                          className={`flex items-center justify-center w-6 h-6
                              ${!isTraitEnabled(traitName) && 'opacity-50 cursor-not-allowed'}
                              ${
                                (hookForcedTraits[currentSetId]?.[layer] ?? '') === traitName
                                  ? 'text-[rgb(var(--color-accent))] hover:text-[rgb(var(--color-accent-dark))] cursor-pointer'
                                  : `text-gray-400 hover:text-[rgb(var(--color-accent))] cursor-pointer`
                              }
                            `}
                          disabled={!isTraitEnabled(traitName)}
                        >
                          {(hookForcedTraits[currentSetId]?.[layer] ?? '') === traitName ? (
                            <EyeOpenIcon className="w-4 h-4" />
                          ) : (
                            <EyeClosedIcon className="w-4 h-4" />
                          )}
                        </button>
                      </Tooltip>
                    </div>

                    <div
                      className={`
                          ${baseStyleSmall}
                          ${!isTraitEnabled(traitName) && 'opacity-50'}
                        `}
                    >
                      <Tooltip
                        tooltip={`Metadata inclusion: ${isTraitIncludedInMetadata(traitName) ? 'Yes' : 'No'}`}
                      >
                        <button
                          onClick={() => void toggleTraitMetadataInclusion(traitName)}
                          className={`flex items-center justify-center w-6 h-6 rounded-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 cursor-pointer
                              ${!isTraitEnabled(traitName) && 'opacity-50 cursor-not-allowed'}
                              ${isTraitIncludedInMetadata(traitName) ? 'text-[rgb(var(--color-secondary))] hover:text-[rgb(var(--color-secondary-dark))] hover:bg-[rgb(var(--color-secondary)/0.1)] dark:hover:bg-[rgb(var(--color-secondary)/0.2)]' : 'text-[rgb(var(--color-quaternary))] hover:text-[rgb(var(--color-quaternary-dark))] hover:bg-[rgb(var(--color-quaternary)/0.1)] dark:hover:bg-[rgb(var(--color-quaternary)/0.2)]'}
                            `}
                          disabled={!isTraitEnabled(traitName)}
                        >
                          {isTraitIncludedInMetadata(traitName) ? (
                            <CheckIcon className="w-4 h-4" />
                          ) : (
                            <CrossIcon className="w-4 h-4" />
                          )}
                        </button>
                      </Tooltip>
                    </div>

                    <div
                      className={`
                          ${baseStyleSmall}
                          ${!isTraitEnabled(traitName) && 'opacity-50'}
                        `}
                    >
                      <Tooltip
                        tooltip={
                          is3DView
                            ? 'Switch to 2D view to tweak blend modes'
                            : isFirstLayer
                              ? 'Blend options not available for first layer traits'
                              : `Blend Mode: ${getTraitSetConfig(traitConfig).blend?.mode ?? DEFAULT_BLEND_PROPERTIES.mode} | Opacity: ${Math.round(
                                  (getTraitSetConfig(traitConfig).blend?.opacity ??
                                    DEFAULT_BLEND_PROPERTIES.opacity) * 100
                                )}%`
                        }
                        forceHide={isBlendSelectorOpen === traitName || !showTooltip}
                      >
                        <div
                          className="relative"
                          ref={blendSelectorRef}
                          onMouseEnter={handleMouseEnter}
                          onMouseLeave={handleMouseLeave}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!isFirstLayer && !is3DView) {
                                toggleBlendSelector(traitName);
                              }
                            }}
                            className={`flex items-center justify-center w-6 h-6
                                ${
                                  isFirstLayer || !isTraitEnabled(traitName) || is3DView
                                    ? 'opacity-50 cursor-not-allowed text-gray-400'
                                    : `${getBlendIconColor(traitConfig)} cursor-pointer`
                                }
                                hover:text-[rgb(var(--color-accent-dark))]
                              `}
                            disabled={isFirstLayer || !isTraitEnabled(traitName) || is3DView}
                          >
                            <MixIcon className="w-4 h-4" />
                          </button>
                          {!isFirstLayer && !is3DView && isBlendSelectorOpen === traitName && (
                            <BlendModeModal
                              isOpen={true}
                              onClose={() => {
                                setIsBlendSelectorOpen('');
                                setShowTooltip(false);
                              }}
                              layer={layer}
                              traitName={traitName}
                            />
                          )}
                        </div>
                      </Tooltip>
                    </div>

                    <div
                      className={`
                          ${baseStyleSmall}
                          ${!isTraitEnabled(traitName) && 'opacity-50'}
                        `}
                    >
                      <Tooltip tooltip="Adjust X/Y offset">
                        <button
                          onClick={() => handleOpenOffsetWindow(traitName)}
                          disabled={!isTraitEnabled(traitName)}
                          className={`flex items-center justify-center w-6 h-6 ${
                            !isTraitEnabled(traitName)
                              ? 'opacity-50 cursor-not-allowed'
                              : 'text-[rgb(var(--color-tertiary))] hover:text-[rgb(var(--color-tertiary-dark))] cursor-pointer'
                          } transition-colors duration-300`}
                        >
                          <MoveIcon className="w-4 h-4" />
                        </button>
                      </Tooltip>
                    </div>

                    <div
                      className={`
                          ${baseStyleSmall}
                          ${isTraitEnabled(traitName) ? '' : ''}
                        `}
                    >
                      <Tooltip
                        tooltip={isTraitEnabled(traitName) ? 'Disable trait' : 'Enable trait'}
                      >
                        <button
                          onClick={() => handleToggleTraitDisable(traitName)}
                          className={`flex items-center justify-center w-6 h-6 ${
                            isTraitEnabled(traitName)
                              ? 'text-[rgb(var(--color-quaternary))] hover:text-[rgb(var(--color-quaternary-dark))] cursor-pointer'
                              : 'text-[rgb(var(--color-primary))] hover:text-[rgb(var(--color-primary-dark))] cursor-pointer'
                          } transition-colors duration-300`}
                        >
                          {isTraitEnabled(traitName) ? (
                            <TrashIcon className="w-4 h-4" />
                          ) : (
                            <RestoreIcon className="w-4 h-4" />
                          )}
                        </button>
                      </Tooltip>
                    </div>
                  </div>
                </div>
              </li>
            ))}
        </ul>
      </motion.div>

      {!isFirstLayer && isLayerBlendOpen && (
        <LayerBlendModal
          key={`blend-modal-${layer}`}
          isOpen={isLayerBlendOpen}
          onClose={() => setIsLayerBlendOpen(false)}
          layer={layer}
        />
      )}
    </div>
  );
};

export default memo(DraggableLayer);
