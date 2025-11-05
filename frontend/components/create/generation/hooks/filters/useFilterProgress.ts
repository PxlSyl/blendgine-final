import { useEffect, useRef, useState, useCallback } from 'react';
import { Effect } from 'effect';
import { FilterProgressInfo } from '@/types/effect';
import { useGenerateStore } from '@/components/store/generate';
import { api } from '@/services';

interface FilterDetails {
  rarity?: number;
  intensity?: number;
  radius?: number;
  presetName?: string;
  palette?: string[];
  color1?: string;
  color2?: string;
}

export const useFilterProgress = (isPaused: boolean) => {
  const { addConsoleMessage } = useGenerateStore();
  const [currentProgress, setCurrentProgress] = useState({ sequenceNumber: 0, totalCount: 0 });

  const updateProgress = useCallback(
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

    const unsubscribe = api.onFilterApplicationProgress((rawPayload: FilterProgressInfo) => {
      if (!isMounted) {
        return;
      }

      Effect.try({
        try: () => {
          if (!rawPayload?.currentImage) {
            throw new Error('Invalid filter progress payload');
          }

          updateProgress({
            sequenceNumber: rawPayload.currentImage.nftNumber,
            totalCount: rawPayload.totalCount,
          });

          if (!isPaused) {
            const { currentImage } = rawPayload;

            let message = `<artwork>Processed Artwork #${currentImage.nftNumber}</artwork>
<index>[0]</index> <trait>Name:</trait> <value>${currentImage.name}</value>`;

            let index = 1;
            if (currentImage.filterType) {
              message += `\n<index>[${index}]</index> <trait>Filter</trait> <value>${currentImage.filterType}</value>`;
              index++;
            }
            if (
              currentImage.filterDetails &&
              typeof currentImage.filterDetails === 'string' &&
              currentImage.filterDetails.trim() !== ''
            ) {
              try {
                const details = JSON.parse(currentImage.filterDetails) as FilterDetails;
                if (details.rarity) {
                  message += `\n<index>[${index}]</index> <trait>Filter rarity</trait> <value>${details.rarity}%</value>`;
                  index++;
                }
                if (details.intensity) {
                  message += `\n<index>[${index}]</index> <trait>Filter intensity</trait> <value>${details.intensity}%</value>`;
                  index++;
                }
                if (typeof details.radius === 'number') {
                  message += `\n<index>[${index}]</index> <trait>Filter radius</trait> <value>${details.radius}%</value>`;
                  index++;
                }
                if (details.presetName) {
                  message += `\n<index>[${index}]</index> <trait>Filter preset</trait> <value>${details.presetName}</value>`;
                  index++;
                }
                if (details.palette) {
                  message += `\n<index>[${index}]</index> <trait>Filter palette</trait> <value>${details.palette.length} colors</value>`;
                  index++;
                }
                if (details.color1) {
                  message += `\n<index>[${index}]</index> <trait>Color 1</trait> <span style="color: ${details.color1}">${details.color1}</span>`;
                  index++;
                }
                if (details.color2) {
                  message += `\n<index>[${index}]</index> <trait>Color 2</trait> <span style="color: ${details.color2}">${details.color2}</span>`;
                  index++;
                }
              } catch {
                // Failed to parse filter details, continue without them
              }
            }
            if (currentImage.horizontalFlipApplied || currentImage.verticalFlipApplied) {
              message += `\n<index>[${index}]</index> <trait>Flips</trait> <value>${[
                currentImage.horizontalFlipApplied ? 'Horizontal' : '',
                currentImage.verticalFlipApplied ? 'Vertical' : '',
              ]
                .filter(Boolean)
                .join(', ')}</value>`;
            }

            addConsoleMessageRef.current({
              type: 'success',
              message,
              sequenceNumber: currentImage.nftNumber,
            });

            addConsoleMessageRef.current({
              type: 'info',
              message: `<progress>Progress: ${rawPayload.currentImage.nftNumber}/${rawPayload.totalCount}</progress>`,
              sequenceNumber: currentImage.nftNumber,
            });
          }
        },
        catch: (error) => {
          addConsoleMessageRef.current({
            type: 'error',
            message: `Error processing filter progress: ${String(error)}`,
            sequenceNumber: 0,
          });
        },
      })
        .pipe(Effect.runPromise)
        .catch(() => {
          // Error already handled in the catch block
        });
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [isPaused, updateProgress]);

  return { currentProgress };
};
