import React from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { useGenerationSettingsStore } from '@/components/store/generationsettings';
import { InputField } from '@/components/shared/InputField';
import { NumericInputWithButtons } from '@/components/shared/NumericInputWithButtons';
import { PlusCircleIcon } from '@/components/icons';
import type { SolanaMetadataConfig, SolanaCreator } from '@/types/effect';

export const SolanaConfig: React.FC = () => {
  const {
    solanaConfig,
    updateSolanaConfig,
    updateSolanaCreator,
    addSolanaCreator,
    removeSolanaCreator,
  } = useGenerationSettingsStore() as {
    solanaConfig: SolanaMetadataConfig;
    updateSolanaConfig: (updates: Partial<SolanaMetadataConfig>) => void;
    updateSolanaCreator: (index: number, updates: Partial<SolanaCreator>) => void;
    addSolanaCreator: () => void;
    removeSolanaCreator: (index: number) => void;
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-2 rounded-sm shadow-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
    >
      <LayoutGroup>
        <motion.h3 layout className="text-md font-semibold text-[rgb(var(--color-primary))] mb-4">
          Solana Configuration
        </motion.h3>

        <motion.div layout className="space-y-4">
          <motion.div layout>
            <InputField
              label="Symbol"
              value={solanaConfig.symbol}
              onChange={(e) => updateSolanaConfig({ symbol: e.target.value })}
              placeholder="Your collection symbol (e.g. BAYC)"
              index={0}
              showContent={true}
            />
          </motion.div>

          <motion.div layout>
            <NumericInputWithButtons
              label="Seller Fee (basis points)"
              value={solanaConfig.sellerFeeBasisPoints.toString()}
              onChange={(value) =>
                updateSolanaConfig({
                  sellerFeeBasisPoints: parseInt(value) || 0,
                })
              }
              min={0}
              max={10000}
              placeholder="500 (e.g. 500 = 5% royalties)"
            />
          </motion.div>

          <motion.div layout>
            <InputField
              label="External URL"
              value={solanaConfig.externalUrl}
              onChange={(e) => updateSolanaConfig({ externalUrl: e.target.value })}
              placeholder="https://yoursite.com"
              index={2}
              showContent={true}
            />
          </motion.div>

          <motion.div layout className="space-y-4">
            <motion.div layout className="flex justify-between items-center">
              <motion.h4 layout className="font-medium text-gray-700 dark:text-gray-300">
                Creators
              </motion.h4>
              {solanaConfig.creators.length < 4 && (
                <button
                  onClick={() => addSolanaCreator()}
                  className="flex items-center text-sm px-3 py-1 bg-[rgb(var(--color-primary))] text-white rounded-md hover:bg-[rgb(var(--color-primary-dark))]"
                >
                  <PlusCircleIcon className="w-4 h-4 mr-2" />
                  Add Creator
                </button>
              )}
            </motion.div>

            <AnimatePresence>
              {solanaConfig.creators.map((creator, index) => (
                <motion.div
                  layout
                  layoutId={`creator-${index}`}
                  key={index}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{
                    duration: 0.2,
                    ease: 'easeInOut',
                  }}
                  className="overflow-hidden pt-2 pb-2 pl-2"
                >
                  <motion.div layout transition={{ duration: 0.2 }} className="w-full">
                    <div className="flex gap-4">
                      <div className="grow">
                        <InputField
                          label={`Creator ${index + 1} Address`}
                          value={creator.address}
                          onChange={(e) => updateSolanaCreator(index, { address: e.target.value })}
                          placeholder="Solana Address"
                          index={index}
                          showContent={true}
                        />
                      </div>
                      <div className="w-40">
                        <NumericInputWithButtons
                          label="Share %"
                          value={creator.share.toString()}
                          onChange={(value) =>
                            updateSolanaCreator(index, {
                              share: parseInt(value) || 0,
                            })
                          }
                          min={0}
                          max={100}
                        />
                      </div>
                      {index === 0 && <div className="self-end mb-2 min-w-[100px]" />}
                      {solanaConfig.creators.length > 1 && index > 0 && (
                        <div className="self-end mb-2 min-w-[100px]">
                          <button
                            onClick={() => removeSolanaCreator(index)}
                            className="w-full px-4 py-2 rounded-md text-sm font-medium transition-colors duration-150 ease-in-out bg-[rgb(var(--color-quaternary)/0.1)] dark:bg-[rgb(var(--color-quaternary)/0.3)] text-[rgb(var(--color-quaternary))] dark:text-[rgb(var(--color-quaternary-dark))] hover:bg-[rgb(var(--color-quaternary)/0.2)] dark:hover:bg-[rgb(var(--color-quaternary)/0.4)]"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                </motion.div>
              ))}
            </AnimatePresence>

            {solanaConfig.creators.reduce((sum, c) => sum + c.share, 0) !== 100 && (
              <motion.p layout className="text-[rgb(var(--color-quaternary))] text-sm">
                Total share must equal 100%
              </motion.p>
            )}
          </motion.div>
        </motion.div>
      </LayoutGroup>
    </motion.div>
  );
};
