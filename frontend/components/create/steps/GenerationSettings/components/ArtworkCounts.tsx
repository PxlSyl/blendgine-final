import React from 'react';
import { motion, Variants } from 'framer-motion';
import type { SetInfo } from '@/types/effect';
import { SetArtworkCount } from './SetArtworkCount';
import { useLayerOrder } from '@/components/store/layerOrder/hook';

interface ArtworkCountsProps {
  sets: Record<string, SetInfo>;
  totalArtworks: number;
  transitionVariants: Variants;
}

export const ArtworkCounts: React.FC<ArtworkCountsProps> = ({
  sets,
  totalArtworks,
  transitionVariants,
}) => {
  const { setOrders } = useLayerOrder();

  const setNFTCountComponents = setOrders
    .sort((a, b) => a.order - b.order)
    .map(({ id: setId }) => {
      const setData = sets[setId];
      if (!setData) {
        return null;
      }
      return <SetArtworkCount key={setId} setId={setId} count={setData.nftCount ?? 10} />;
    })
    .filter(Boolean);

  return (
    <>
      <motion.div
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={transitionVariants}
        transition={{ duration: 0.5, ease: 'easeOut', delay: 0.2 }}
        className="p-2 rounded-sm shadow-md mb-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
      >
        <div className="text-md font-semibold mb-4 text-[rgb(var(--color-primary))]">
          Artworks Count per Set
        </div>
        <div className="space-y-4">{setNFTCountComponents}</div>
      </motion.div>

      <div className="p-2 rounded-sm shadow-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <span className="text-xl font-semibold text-[rgb(var(--color-primary))]">
            Total Artworks
          </span>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-[rgb(var(--color-secondary))]">
              {totalArtworks}
            </span>
            <span className="font-mono text-lg font-bold text-gray-500 dark:text-gray-400">
              Artworks
            </span>
          </div>
        </div>
      </div>
    </>
  );
};
