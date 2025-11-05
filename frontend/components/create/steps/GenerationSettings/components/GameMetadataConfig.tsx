import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { useClickOutside } from '@/components/hooks/useClickOutside';
import { useGenerationSettingsStore } from '@/components/store/generationsettings';
import { useDataGamingStore } from '@/components/store/generationsettings/useDataGamingStore';
import { useProjectSetup } from '@/components/store/projectSetup/hook';

import {
  PlusCircleIcon,
  TrashIcon,
  InfoIcon,
  ChevronDownIcon,
  CrossIcon,
  DiceIcon,
} from '@/components/icons';
import CheckboxWithLabel from '@/components/shared/CheckboxWithLabel';
import { InputField } from '@/components/shared/InputField';

const ATTRIBUTE_TYPES = [
  { id: 'text', label: 'Text' },
  { id: 'number', label: 'Number' },
  { id: 'array', label: 'Array' },
] as const;

const GameMetadataConfig: React.FC = () => {
  const { isAnimatedCollection } = useProjectSetup();
  const includeSpritesheets = useGenerationSettingsStore((state) => state.includeSpritesheets);
  const setIncludeSpritesheets = useGenerationSettingsStore(
    (state) => state.setIncludeSpritesheets
  );

  const {
    headers,
    isTypeOpen,
    currentTextValue,
    addHeader,
    removeHeader,
    updateHeaderName,
    addAttribute,
    removeAttribute,
    updateAttribute,
    setCurrentTextValue,
    toggleTypeDropdown,
    handleArrayValueChange,
    handleTextValueChange,
    toggleRandomMode,
    setArrayMode,
    setArraySize,
    canEnableRandom,
  } = useDataGamingStore();

  const transitionVariants = useMemo(
    () => ({
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: 20 },
    }),
    []
  );

  const activeDropdownRef = useClickOutside(() => {
    const openAttributeId = Object.entries(isTypeOpen).find(([, isOpen]) => isOpen)?.[0];
    if (openAttributeId) {
      toggleTypeDropdown(openAttributeId);
    }
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="p-2 rounded-sm shadow-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
    >
      <div className="mb-2">
        <div className="text-md font-semibold text-[rgb(var(--color-primary))] mb-4">
          Gaming Options
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={addHeader}
            className="flex items-center px-3 py-1.5 text-sm bg-[rgb(var(--color-primary))] text-white rounded-md hover:bg-[rgb(var(--color-primary-dark))]"
          >
            <PlusCircleIcon className="w-4 h-4 mr-2" />
            Add Header
          </button>
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
            <InfoIcon className="w-5 h-5 mr-2" />
            <span className="italic">Optional metadata parameters for web3 gaming</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col space-y-8">
        <AnimatePresence>
          {headers.map((header) => (
            <motion.div
              key={header.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="p-6 rounded-sm border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <InputField
                    label="Header Name"
                    value={header.name}
                    onChange={(e) => updateHeaderName(header.id, e.target.value)}
                    type="text"
                    placeholder="(e.g. attributes, properties, stats...)"
                    showContent={true}
                    index={0}
                  />
                  <button
                    onClick={() => addAttribute(header.id)}
                    className="flex items-center px-3 py-1.5 text-sm bg-[rgb(var(--color-primary))] text-white rounded-md hover:bg-[rgb(var(--color-primary-dark))]"
                  >
                    <PlusCircleIcon className="w-4 h-4 mr-2" />
                    Add Attribute
                  </button>
                </div>
                {headers.length > 1 && (
                  <button
                    onClick={() => removeHeader(header.id)}
                    className="p-2 rounded-md transition-colors hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                )}
              </div>

              <div className="flex flex-col space-y-4">
                <AnimatePresence>
                  {header.attributes.map((attr) => (
                    <motion.div
                      key={attr.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="p-4 border-t border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex items-center gap-4 mb-4">
                        <div className="grow grid grid-cols-1 lg:grid-cols-2 gap-4">
                          <div className="flex gap-4">
                            <div className="flex-1">
                              <InputField
                                label="Trait Name"
                                value={attr.trait_type}
                                onChange={(e) =>
                                  updateAttribute(header.id, attr.id, {
                                    trait_type: e.target.value,
                                  })
                                }
                                type="text"
                                placeholder="(e.g. power, speed, weapon, damage...)"
                                showContent={true}
                                index={0}
                              />
                            </div>

                            <div className="flex-1">
                              <div className="relative">
                                <label className="z-10 pr-2 absolute text-xs font-bold text-gray-700 dark:text-gray-300 transition-all duration-300 ease-in-out left-0 -top-2.5 px-1 bg-white/75 dark:bg-gray-800/75 rounded-sm">
                                  Type
                                </label>
                                <div
                                  className="relative group"
                                  ref={isTypeOpen[attr.id] ? activeDropdownRef : null}
                                >
                                  <div className="absolute inset-0 bg-gradient-to-r from-[rgb(var(--color-primary-light)/0.75)] to-[rgb(var(--color-secondary-dark)/0.75)] rounded-sm blur-sm" />
                                  <button
                                    type="button"
                                    onClick={() => toggleTypeDropdown(attr.id)}
                                    className="w-full px-4 py-3 rounded-sm transition-all duration-300 ease-in-out relative bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 text-left flex justify-between items-center pt-4"
                                  >
                                    <span
                                      className={`${attr.type ? '' : 'text-[rgb(var(--color-secondary))]'}`}
                                    >
                                      {ATTRIBUTE_TYPES.find((t) => t.id === attr.type)?.label ??
                                        'Select Type'}
                                    </span>
                                    <ChevronDownIcon
                                      className={`w-4 h-4 transition-transform duration-300 ${
                                        isTypeOpen[attr.id] ? 'transform rotate-180' : ''
                                      }`}
                                    />
                                  </button>

                                  <AnimatePresence>
                                    {isTypeOpen[attr.id] && (
                                      <motion.div
                                        initial="hidden"
                                        animate="visible"
                                        exit="exit"
                                        variants={transitionVariants}
                                        transition={{ duration: 0.3, ease: 'easeOut' }}
                                        className={`absolute z-50 w-full mt-1 rounded-md shadow-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600`}
                                      >
                                        <ul className="py-1 overflow-auto max-h-48 scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-500 scrollbar-track-gray-100 dark:scrollbar-track-gray-700 text-gray-900 dark:text-white">
                                          {ATTRIBUTE_TYPES.map((type) => (
                                            <li
                                              key={type.id}
                                              onClick={() => {
                                                updateAttribute(header.id, attr.id, {
                                                  type: type.id,
                                                });
                                                toggleTypeDropdown(attr.id);
                                              }}
                                              className="px-3 py-1.5 cursor-pointer text-sm hover:bg-gray-100 dark:hover:bg-gray-600"
                                            >
                                              {type.label}
                                            </li>
                                          ))}
                                        </ul>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="w-full">
                            {attr.type === 'text' && (
                              <div className="w-full space-y-4">
                                <div className="flex gap-4">
                                  <div className="grow">
                                    <div className="relative">
                                      <label
                                        className={`z-10 pr-2 absolute text-xs font-bold 
                                        transition-all duration-300 ease-in-out
                                        left-0 -top-2.5 px-1 bg-white/75 dark:bg-gray-800/75 rounded-sm`}
                                      >
                                        Value
                                      </label>
                                      <input
                                        type="text"
                                        value={currentTextValue}
                                        onChange={(e) => setCurrentTextValue(e.target.value)}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter' && currentTextValue.trim()) {
                                            e.preventDefault();
                                            handleTextValueChange(
                                              header.id,
                                              attr.id,
                                              currentTextValue
                                            );
                                            setCurrentTextValue('');
                                          }
                                        }}
                                        placeholder="(e.g. Legendary, Rare, Common)"
                                        className={`w-full px-4 py-3 rounded-sm transition-all duration-300 ease-in-out relative pt-4`}
                                      />
                                    </div>
                                  </div>
                                  <div className="flex items-start">
                                    <button
                                      onClick={() => {
                                        if (currentTextValue.trim()) {
                                          handleTextValueChange(
                                            header.id,
                                            attr.id,
                                            currentTextValue
                                          );
                                          setCurrentTextValue('');
                                        }
                                      }}
                                      className={`h-[52px] px-4 rounded-sm transition-colors`}
                                    >
                                      <PlusCircleIcon className="w-5 h-5" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}

                            {attr.type === 'array' && (
                              <div className="w-full space-y-4">
                                <div className="flex gap-4">
                                  <div className="grow">
                                    <div className="relative">
                                      <label
                                        className={`z-10 pr-2 absolute text-xs font-bold 
                                        transition-all duration-300 ease-in-out
                                        left-0 -top-2.5 px-1 bg-white/75 dark:bg-gray-800/75 rounded-sm`}
                                      >
                                        Value
                                      </label>
                                      <input
                                        type="text"
                                        value={Object.values(attr.arrayValues ?? {}).join(', ')}
                                        onChange={(e) =>
                                          handleArrayValueChange(header.id, attr.id, e.target.value)
                                        }
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter' && currentTextValue.trim()) {
                                            e.preventDefault();
                                            handleArrayValueChange(
                                              header.id,
                                              attr.id,
                                              currentTextValue
                                            );
                                            setCurrentTextValue('');
                                          }
                                        }}
                                        placeholder="(e.g. Game A, Game B, Game C)"
                                        className={`w-full px-4 py-3 rounded-sm transition-all duration-300 ease-in-out relative pt-4`}
                                      />
                                    </div>
                                  </div>
                                  <div className="flex items-start">
                                    <button
                                      onClick={() => {
                                        if (currentTextValue.trim()) {
                                          handleArrayValueChange(
                                            header.id,
                                            attr.id,
                                            currentTextValue
                                          );
                                          setCurrentTextValue('');
                                        }
                                      }}
                                      className={`h-[52px] px-4 rounded-sm transition-colors`}
                                    >
                                      <PlusCircleIcon className="w-5 h-5" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}

                            {attr.type === 'number' && (
                              <div className="grid grid-cols-2 gap-4">
                                <div className="flex-1">
                                  <div className="relative">
                                    <label
                                      className={`z-10 pr-2 absolute text-xs font-bold 
                                      transition-all duration-300 ease-in-out
                                      left-0 -top-2.5 px-1 bg-white/75 dark:bg-gray-800/75 rounded-sm`}
                                    >
                                      Min Value
                                    </label>
                                    <input
                                      type="number"
                                      value={attr.min}
                                      onChange={(e) =>
                                        updateAttribute(header.id, attr.id, {
                                          min: parseInt(e.target.value),
                                        })
                                      }
                                      placeholder="1"
                                      className={`w-full px-4 py-3 rounded-sm transition-all duration-300 ease-in-out relative pt-4`}
                                    />
                                  </div>
                                </div>
                                <div className="flex-1">
                                  <div className="relative">
                                    <label
                                      className={`z-10 pr-2 absolute text-xs font-bold 
                                      transition-all duration-300 ease-in-out
                                      left-0 -top-2.5 px-1 bg-white/75 dark:bg-gray-800/75 rounded-sm`}
                                    >
                                      Max Value
                                    </label>
                                    <input
                                      type="number"
                                      value={attr.max}
                                      onChange={(e) =>
                                        updateAttribute(header.id, attr.id, {
                                          max: parseInt(e.target.value),
                                        })
                                      }
                                      placeholder="100"
                                      className={`w-full px-4 py-3 rounded-sm transition-all duration-300 ease-in-out relative pt-4`}
                                    />
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {attr.type === 'array' && (
                          <div className="mt-4 space-y-4">
                            <div className="flex items-center gap-4">
                              <label className={`text-sm font-medium`}>Array Mode</label>
                              <select
                                value={attr.arrayMode}
                                onChange={(e) =>
                                  setArrayMode(
                                    header.id,
                                    attr.id,
                                    e.target.value as 'multiple_arrays' | 'random_texts'
                                  )
                                }
                                className={`px-3 py-1.5 rounded-sm`}
                              >
                                <option value="multiple_arrays">Multiple Arrays</option>
                                <option value="random_texts">Random Texts</option>
                              </select>
                            </div>

                            {attr.arrayMode === 'random_texts' &&
                              Object.keys(attr.textValues ?? {}).length >= 3 && (
                                <div className="flex items-center gap-4">
                                  <label className={`text-sm font-medium`}>Array Size</label>
                                  <input
                                    type="number"
                                    min="1"
                                    max={Object.keys(attr.textValues ?? {}).length}
                                    value={attr.arraySize}
                                    onChange={(e) =>
                                      setArraySize(header.id, attr.id, parseInt(e.target.value))
                                    }
                                    className={`w-24 px-3 py-1.5 rounded-sm`}
                                  />
                                </div>
                              )}
                          </div>
                        )}

                        <div className="flex items-center gap-2 mt-4 ml-auto">
                          {canEnableRandom(attr) && (
                            <button
                              onClick={() => toggleRandomMode(header.id, attr.id)}
                              className={`p-2 rounded-md transition-colors ${
                                attr.isRandomMode ? 'text-[rgb(var(--color-primary))]' : ''
                              }`}
                              title={
                                attr.isRandomMode ? 'Random mode enabled' : 'Enable random mode'
                              }
                            >
                              <DiceIcon className="w-5 h-5" />
                            </button>
                          )}
                          <button
                            onClick={() => removeAttribute(header.id, attr.id)}
                            className={`p-2 rounded-md transition-colors`}
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      <div className="w-full">
                        {attr.type === 'text' && (
                          <div className="w-full space-y-4">
                            {attr.textValues && Object.keys(attr.textValues).length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {Object.entries(attr.textValues).map(([id, value]) => (
                                  <div
                                    key={id}
                                    className={`flex items-center gap-2 px-2 py-1 rounded-md`}
                                  >
                                    <button
                                      onClick={() => {
                                        const newValues = { ...attr.textValues };
                                        delete newValues[id];
                                        updateAttribute(header.id, attr.id, {
                                          textValues: newValues,
                                        });
                                      }}
                                      className={`hover:text-red-500 transition-colors`}
                                    >
                                      <CrossIcon className="w-3 h-3" />
                                    </button>
                                    <span className="text-sm">{String(value)}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {attr.type === 'array' && (
                          <div className="w-full space-y-4">
                            {attr.arrayValues && Object.keys(attr.arrayValues).length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {Object.entries(attr.arrayValues).map(([id, value]) => (
                                  <div
                                    key={id}
                                    className={`flex items-center gap-2 px-2 py-1 rounded-md`}
                                  >
                                    <button
                                      onClick={() => {
                                        const newValues = { ...attr.arrayValues };
                                        delete newValues[id];
                                        updateAttribute(header.id, attr.id, {
                                          arrayValues: newValues,
                                        });
                                      }}
                                      className={`hover:text-red-500 transition-colors`}
                                    >
                                      <CrossIcon className="w-3 h-3" />
                                    </button>
                                    <span className="text-sm">{String(value)}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {isAnimatedCollection && (
        <div className="flex flex-col lg:flex-row lg:items-center gap-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <CheckboxWithLabel
              label="Include Spritesheets"
              checked={includeSpritesheets}
              onChange={(checked) => setIncludeSpritesheets(checked)}
            />
            <div className="text-sm italic flex items-center text-gray-500 dark:text-gray-400">
              <InfoIcon className="w-6 h-6 mr-2 shrink-0" />
              <span className="flex-1">
                Generate spritesheets for each artwork to use in your games
              </span>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default React.memo(GameMetadataConfig);
