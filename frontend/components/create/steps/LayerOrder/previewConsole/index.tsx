import React, { useRef, useEffect } from 'react';
import { Effect } from 'effect';
import type { OrderedLayersSets, RarityConfig } from '@/types/effect';
import { usePreviewMessages } from './hook/usePreviewMessages';
import { ImageWithElement } from '../canvas/hooks/useImagesSorting';

interface PreviewConsoleProps {
  isGenerating: boolean;
  sortedImages: ImageWithElement[];
  viewMode: '2d' | '3d';
  rarityConfig: RarityConfig;
  activeSet: string;
  orderedLayersSets: OrderedLayersSets;
  layers: string[];
  cameraType: 'perspective' | 'orthographic';
}

const PreviewConsole: React.FC<PreviewConsoleProps> = ({
  isGenerating,
  sortedImages,
  viewMode,
  rarityConfig,
  activeSet,
  orderedLayersSets,
  layers,
  cameraType,
}) => {
  const { messages, formattedMessages } = usePreviewMessages(
    isGenerating,
    sortedImages,
    viewMode,
    rarityConfig,
    activeSet,
    orderedLayersSets,
    layers,
    cameraType
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollEffect = Effect.gen(function* (_) {
      if (containerRef.current) {
        const container = containerRef.current;
        const targetScroll = container.scrollHeight;
        const startScroll = container.scrollTop;
        const distance = targetScroll - startScroll;

        const startTime = performance.now();
        const duration = 300;

        const animateScroll = (currentTime: number) => {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const easeOutCubic = 1 - Math.pow(1 - progress, 3);

          container.scrollTop = startScroll + distance * easeOutCubic;

          if (progress < 1) {
            requestAnimationFrame(animateScroll);
          }
        };

        yield* _(
          Effect.tryPromise({
            try: () =>
              new Promise<void>((resolve) => {
                requestAnimationFrame(animateScroll);
                setTimeout(resolve, duration);
              }),
            catch: (error) => {
              console.error('Error during scroll animation:', error);
              return Promise.resolve();
            },
          })
        );
      }
    });

    void Effect.runPromise(scrollEffect);
  }, [messages]);

  return (
    <div className="hidden xs:block h-[160px] bg-gray-100 dark:bg-gray-900 font-mono text-xs sm:text-sm rounded-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-1 bg-gray-200 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700">
        <span className="text-[rgb(var(--color-secondary))] font-semibold">Preview Console</span>
      </div>
      <div ref={containerRef} className="px-4 pt-4 h-[calc(100%-32px)] overflow-y-auto">
        {formattedMessages.map((msg) => (
          <div key={msg.id} className="mb-2">
            <div className="flex items-start">
              <span className="text-gray-500 mr-2 opacity-75">[{msg.timestamp}]</span>
              <div className={msg.className} dangerouslySetInnerHTML={{ __html: msg.content }} />
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default PreviewConsole;
