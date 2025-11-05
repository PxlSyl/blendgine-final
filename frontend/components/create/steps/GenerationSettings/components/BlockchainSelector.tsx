import React from 'react';
import { motion, Variants } from 'framer-motion';
import { ETH_ICON, SOL_ICON } from '@/components/icons/blockchainIcons';
import Dropdown from '@/components/shared/Dropdown';

type BlockchainType = 'eth' | 'sol';

interface BlockchainSelectorProps {
  blockchain: BlockchainType;
  blockchains: BlockchainType[];
  selectBlockchain: (chain: BlockchainType) => void;
  transitionVariants: Variants;
}

export const BlockchainSelector: React.FC<BlockchainSelectorProps> = ({
  blockchain,
  blockchains,
  selectBlockchain,
  transitionVariants,
}) => {
  const getBlockchainLabel = (chain: string) => {
    return chain === 'eth' ? 'Ethereum' : 'Solana';
  };

  const BlockchainOption = ({ chain }: { chain: string }) => (
    <div className="flex items-center">
      {chain === 'eth' ? ETH_ICON : SOL_ICON}
      <span className="ml-2">{getBlockchainLabel(chain)}</span>
    </div>
  );

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={transitionVariants}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="p-2 rounded-sm shadow-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
    >
      <label className="block text-md font-semibold text-[rgb(var(--color-primary))] mb-2">
        Target Blockchain
      </label>
      <div className="relative">
        <Dropdown
          options={blockchains}
          value={blockchain}
          onChange={(chain) => selectBlockchain(chain as BlockchainType)}
          placeholder="Select blockchain"
          textColorClass="text-gray-500 dark:text-gray-400"
          hoverBgClass="hover:bg-gray-50 dark:hover:bg-gray-600"
          renderOption={(option) => <BlockchainOption chain={option} />}
          renderValue={() => <BlockchainOption chain={blockchain} />}
        />
      </div>
    </motion.div>
  );
};
