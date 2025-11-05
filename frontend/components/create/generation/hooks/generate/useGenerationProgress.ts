import { useEffect, useRef, useCallback, useState } from 'react';
import { api } from '@/services';
import type { NFTProgressInfo } from '@/services/types';
import { useGenerateStore } from '@/components/store/generate';

export const useGenerationProgress = () => {
  const { addConsoleMessage } = useGenerateStore();
  const [currentProgress, setCurrentProgress] = useState({ sequenceNumber: 0, totalCount: 0 });

  const memoizedSetCurrentProgress = useCallback(
    (newProgress: { sequenceNumber: number; totalCount: number }) => {
      setCurrentProgress((prev) => {
        if (newProgress.sequenceNumber > prev.sequenceNumber) {
          return newProgress;
        }
        return prev;
      });
    },
    []
  );

  const addConsoleMessageRef = useRef(addConsoleMessage);

  useEffect(() => {
    addConsoleMessageRef.current = addConsoleMessage;
  }, [addConsoleMessage]);

  useEffect(() => {
    let isMounted = true;

    const unsubscribeProgress = api.onNFTGenerationProgress((progressInfo: NFTProgressInfo) => {
      if (!isMounted) {
        return;
      }

      const { currentImage, sequenceNumber = 0, totalCount } = progressInfo;

      if (currentImage?.path) {
        const displayName = currentImage.name ?? 'unnamed';

        memoizedSetCurrentProgress({
          sequenceNumber,
          totalCount,
        });

        let message = `<artwork>Generated Artwork #${sequenceNumber}</artwork>
<index>[0]</index> <trait>Name:</trait> <value>${displayName}</value>`;

        let index = 1;
        if (currentImage.traits) {
          Object.entries(currentImage.traits).forEach(([key, value]) => {
            message += `\n<index>[${index}]</index> <trait>${key}:</trait> <value>${value}</value>`;
            index++;
          });
        }

        addConsoleMessageRef.current({
          type: 'success',
          message,
          sequenceNumber,
        });

        addConsoleMessageRef.current({
          type: 'info',
          message: `<progress>Progress: ${sequenceNumber}/${totalCount}</progress>`,
          sequenceNumber,
        });
      }
    });

    return () => {
      isMounted = false;
      unsubscribeProgress();
    };
  }, [memoizedSetCurrentProgress]);

  return { currentProgress };
};
