import React, { useCallback } from 'react';
import { useLayerOrder } from '@/components/store/layerOrder/hook';
import { NumericInputWithButtons } from '@/components/shared/NumericInputWithButtons';

export const SetArtworkCount: React.FC<{
  setId: string;
  count: number;
}> = React.memo(({ setId, count = 10 }) => {
  const { sets, updateSetNFTCount } = useLayerOrder();
  const setNumber = setId.replace('set', '');
  const customName = sets[setId]?.customName;
  const displayName = customName ?? `Set ${setNumber}`;

  const handleCountChange = useCallback(
    (value: string) => {
      const newCount = parseInt(value) || 0;
      updateSetNFTCount(setId, newCount);
    },
    [setId, updateSetNFTCount]
  );

  return (
    <NumericInputWithButtons
      label={
        <span>
          <span className="text-[rgb(var(--color-secondary))]">[{displayName}]</span>
          <span> Artworks Count</span>
        </span>
      }
      value={count.toString()}
      onChange={handleCountChange}
      placeholder="Number of artworks to generate"
      min={1}
    />
  );
});

SetArtworkCount.displayName = 'SetArtworkCount';
