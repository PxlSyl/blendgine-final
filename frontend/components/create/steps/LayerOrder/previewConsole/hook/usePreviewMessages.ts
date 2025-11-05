import { useState, useCallback, useEffect, useMemo } from 'react';
import { Effect } from 'effect';

import { generateUUID } from '@/utils/functionsUtils';
import type { ConsoleMessage, RarityConfig, LayerConfig } from '@/types/effect';
import { DEFAULT_BLEND_PROPERTIES, BlendProperties, BlendMode } from '@/types/blendModes';

interface LayerData {
  layerName: string;
  traitName: string;
}

interface SetData {
  layers: string[];
  customName?: string;
}

interface OrderedSets {
  [key: string]: SetData;
}

interface FormattedMessage {
  id: string;
  timestamp: string;
  className: string;
  content: string;
}

const isLayerConfig = (obj: unknown): obj is LayerConfig => {
  return obj !== null && typeof obj === 'object' && 'sets' in obj;
};

const isBlendProperties = (blend: unknown): blend is BlendProperties => {
  return (
    blend !== null &&
    typeof blend === 'object' &&
    'mode' in blend &&
    'opacity' in blend &&
    typeof (blend as BlendProperties).mode === 'string' &&
    typeof (blend as BlendProperties).opacity === 'number'
  );
};

const getBlendMode = (blend: unknown): BlendMode => {
  if (isBlendProperties(blend)) {
    return blend.mode;
  }
  return DEFAULT_BLEND_PROPERTIES.mode;
};

const getBlendOpacity = (blend: unknown): number => {
  if (isBlendProperties(blend)) {
    return blend.opacity;
  }
  return DEFAULT_BLEND_PROPERTIES.opacity;
};

const getMessageColor = (type: ConsoleMessage['type']) => {
  switch (type) {
    case 'success':
      return 'text-[rgb(var(--color-quinary))] whitespace-pre-wrap';
    case 'error':
      return 'text-[rgb(var(--color-quaternary))] whitespace-pre-wrap';
    case 'warning':
      return 'text-[rgb(var(--color-quaternary))] whitespace-pre-wrap';
    default:
      return 'text-[rgb(var(--color-accent))] whitespace-pre-wrap';
  }
};

const formatMessage = (message: string) => {
  const styledMessage = message
    .replace(
      /<nft>(.*?)<\/nft>/g,
      '<span class="text-[rgb(var(--color-primary))] font-bold">$1</span>'
    )
    .replace(/<trait>(.*?)<\/trait>/g, '<span class="text-[rgb(var(--color-accent))]">$1</span>')
    .replace(/<attr>(.*?)<\/attr>/g, '<span class="text-[rgb(var(--color-quinary))]">$1</span>')
    .replace(
      /<value>(.*?)<\/value>/g,
      '<span class="text-[rgb(var(--color-quaternary))]">$1</span>'
    )
    .replace(/<index>(.*?)<\/index>/g, '<span class="text-gray-500">$1</span>');

  if (message.includes('\n')) {
    return styledMessage
      .split('\n')
      .map((line) => `<div class="ml-4">${line}</div>`)
      .join('');
  }
  return styledMessage;
};

export const usePreviewMessages = (
  isGenerating: boolean,
  sortedImages: LayerData[],
  viewMode: '2d' | '3d',
  rarityConfig: RarityConfig,
  activeSet: string,
  orderedLayersSets: OrderedSets,
  layers: string[],
  cameraType: string
): { messages: ConsoleMessage[]; formattedMessages: FormattedMessage[] } => {
  const [messages, setMessages] = useState<ConsoleMessage[]>([]);
  const [isCurrentlyGenerating, setIsCurrentlyGenerating] = useState(false);

  const formattedMessages = useMemo(() => {
    return messages.map(
      (msg) =>
        ({
          id: msg.id,
          timestamp: msg.timestamp,
          className: getMessageColor(msg.type),
          content: formatMessage(msg.message),
        }) as FormattedMessage
    );
  }, [messages]);

  const addMessage = useCallback((message: Omit<ConsoleMessage, 'id' | 'timestamp'>) => {
    setMessages((prev) => [
      ...prev,
      {
        ...message,
        id: generateUUID(),
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
  }, []);

  useEffect(() => {
    if (isGenerating && !isCurrentlyGenerating) {
      setIsCurrentlyGenerating(true);
      addMessage({
        type: 'info',
        message: `<nft>Generating Preview</nft>\n<index>[*]</index> <trait>Status</trait> <value>Loading new preview...</value>`,
        sequenceNumber: 0,
      });
    } else if (!isGenerating && isCurrentlyGenerating) {
      setIsCurrentlyGenerating(false);
    }
  }, [isGenerating, isCurrentlyGenerating, addMessage]);

  useEffect(() => {
    const messageEffect = Effect.gen(function* (_) {
      if (sortedImages.length > 0 && !isGenerating) {
        addMessage({
          type: 'info',
          message: '───────────────────────────────────',
          sequenceNumber: 0,
        });

        const setStatusMessage = yield* _(
          Effect.try({
            try: () => {
              return Object.keys(orderedLayersSets || {})
                .sort((keyA, keyB) => {
                  const numA = parseInt(keyA.replace('set', ''));
                  const numB = parseInt(keyB.replace('set', ''));
                  return numA - numB;
                })
                .map((setKey) => {
                  const setNumber = setKey.replace('set', '');
                  const setConfig = orderedLayersSets[setKey];
                  const setName = setConfig.customName
                    ? `${setConfig.customName} (Set ${setNumber})`
                    : `Set ${setNumber}`;
                  const activeLayers = Object.values(rarityConfig || {}).reduce(
                    (count: number, layerConfig: unknown) => {
                      if (isLayerConfig(layerConfig) && layerConfig.sets?.[setKey]?.active) {
                        return count + 1;
                      }
                      return count;
                    },
                    0
                  );
                  return `<index>[*]</index> <trait>${setName}</trait> <value>${activeLayers} layers</value>`;
                })
                .join('\n');
            },
            catch: (error) => {
              console.error('Error generating set status message:', error);
              return '';
            },
          })
        );

        addMessage({
          type: 'info',
          message: `<nft>Set Status</nft>\n${setStatusMessage}`,
          sequenceNumber: 0,
        });

        const activeLayersDetails = yield* _(
          Effect.try({
            try: () => {
              return Object.entries(rarityConfig || {})
                .filter(
                  ([, layerConfig]) =>
                    isLayerConfig(layerConfig) && layerConfig.sets?.[activeSet]?.active
                )
                .sort((a, b) => {
                  const [, layerConfigA] = a;
                  const [, layerConfigB] = b;

                  if (!isLayerConfig(layerConfigA) || !isLayerConfig(layerConfigB)) {
                    return 0;
                  }

                  const traitsA = layerConfigA.traits ?? {};
                  const traitsB = layerConfigB.traits ?? {};

                  const [firstTraitKeyA] = Object.keys(traitsA);
                  const [firstTraitKeyB] = Object.keys(traitsB);

                  if (!firstTraitKeyA || !firstTraitKeyB) {
                    return 0;
                  }

                  const aZIndex = traitsA[firstTraitKeyA]?.sets?.[activeSet]?.zIndex ?? 0;
                  const bZIndex = traitsB[firstTraitKeyB]?.sets?.[activeSet]?.zIndex ?? 0;

                  return aZIndex - bZIndex;
                })
                .map(([layerName, layerConfig], index) => {
                  if (!isLayerConfig(layerConfig)) {
                    return '';
                  }

                  const traits = layerConfig.traits ?? {};
                  const [firstTraitKey] = Object.keys(traits);

                  if (!firstTraitKey) {
                    return '';
                  }

                  const zIndex = traits[firstTraitKey]?.sets?.[activeSet]?.zIndex ?? 0;
                  const defaultBlend = layerConfig.defaultBlend ?? DEFAULT_BLEND_PROPERTIES;
                  const customBlend = traits[firstTraitKey]?.sets?.[activeSet]?.blend;

                  const blendInfo =
                    index === 0
                      ? 'blend: Blend not allowed on first layer'
                      : customBlend
                        ? `blend: ${getBlendMode(customBlend)} (${Math.round(getBlendOpacity(customBlend) * 100)}% opacity)`
                        : `blend: ${getBlendMode(defaultBlend)} (${Math.round(getBlendOpacity(defaultBlend) * 100)}% opacity)`;

                  return `  <index>└─</index> <trait>${layerName}</trait> <value>z-index: ${zIndex}</value> | <value>${blendInfo}</value>`;
                })
                .filter((item) => item !== '');
            },
            catch: (error) => {
              console.error('Error generating active layers details:', error);
              return [];
            },
          })
        );

        if (activeLayersDetails.length > 0) {
          const activeSetNumber = activeSet.replace('set', '');
          const activeSetConfig = orderedLayersSets[activeSet];
          const activeSetName = activeSetConfig?.customName
            ? `${activeSetConfig.customName} (Set ${activeSetNumber})`
            : `Set ${activeSetNumber}`;

          addMessage({
            type: 'info',
            message: `<nft>Preview ${activeSetName} Details</nft>\n${activeLayersDetails.join('\n')}`,
            sequenceNumber: 0,
          });
        }

        const activeLayersCount = Object.values(rarityConfig || {}).reduce(
          (count: number, layerConfig: unknown) => {
            if (isLayerConfig(layerConfig) && layerConfig.sets?.[activeSet]?.active) {
              return count + 1;
            }
            return count;
          },
          0
        );

        addMessage({
          type: 'info',
          message:
            `<nft>Preview Update</nft>\n` +
            `<index>[0]</index> <trait>Mode</trait> <value>${viewMode.toUpperCase()}</value>\n` +
            `<index>[1]</index> <trait>Layers</trait> <value>${activeLayersCount}</value>`,
          sequenceNumber: 0,
        });

        yield* _(
          Effect.try({
            try: () => {
              sortedImages.forEach((img, index) => {
                const layerConfig = rarityConfig?.[img.layerName];
                if (!isLayerConfig(layerConfig)) {
                  return;
                }

                const traits = layerConfig.traits ?? {};
                const traitConfig = traits[img.traitName];
                const zIndex = Number(
                  traitConfig?.sets?.[activeSet]?.zIndex ?? layers.indexOf(img.layerName)
                );

                const defaultBlend = layerConfig.defaultBlend ?? DEFAULT_BLEND_PROPERTIES;
                const blendMode =
                  getBlendMode(traitConfig?.sets?.[activeSet]?.blend) ?? getBlendMode(defaultBlend);
                const opacity =
                  getBlendOpacity(traitConfig?.sets?.[activeSet]?.blend) ||
                  getBlendOpacity(defaultBlend);
                const blendInfo = `${blendMode} (${Math.round(opacity * 100)}% opacity)`;

                addMessage({
                  type: 'success',
                  message:
                    `<index>[${index + 2}]</index> <trait>Layer</trait> <value>${img.layerName}</value>\n` +
                    `  <index>└─</index> <trait>Trait</trait> <value>${img.traitName}</value>\n` +
                    `  <index>└─</index> <trait>Z-Index</trait> <value>${zIndex}</value>\n` +
                    `  <index>└─</index> <trait>Blend</trait> <value>${blendInfo}</value>`,
                  sequenceNumber: 0,
                });
              });
            },
            catch: (error) => {
              console.error('Error generating sorted images details:', error);
            },
          })
        );

        yield* _(
          Effect.try({
            try: () => {
              const uniqueLayers = Object.keys(rarityConfig || {}).length;

              const totalTraits = Object.values(rarityConfig || {}).reduce(
                (total: number, layerConfig: unknown) => {
                  if (isLayerConfig(layerConfig) && layerConfig.traits) {
                    return total + Object.keys(layerConfig.traits).length;
                  }
                  return total;
                },
                0
              );

              const customBlendCount = sortedImages.filter((img) => {
                const layerConfig = rarityConfig?.[img.layerName];
                if (!isLayerConfig(layerConfig) || !layerConfig.traits) {
                  return false;
                }

                const traitConfig = layerConfig.traits[img.traitName];
                return traitConfig?.sets?.[activeSet]?.blend !== undefined;
              }).length;

              const customZIndexCount = sortedImages.filter((img) => {
                const layerConfig = rarityConfig?.[img.layerName];
                if (!isLayerConfig(layerConfig) || !layerConfig.traits) {
                  return false;
                }

                const traitConfig = layerConfig.traits[img.traitName];
                return traitConfig?.sets?.[activeSet]?.zIndex !== undefined;
              }).length;

              addMessage({
                type: 'info',
                message:
                  `<nft>Preview Stats</nft>\n` +
                  `<index>[*]</index> <trait>Unique Layers</trait> <value>${uniqueLayers}</value>\n` +
                  `<index>[*]</index> <trait>Total Traits</trait> <value>${totalTraits}</value>\n` +
                  `<index>[*]</index> <trait>Custom Blends</trait> <value>${customBlendCount}</value>\n` +
                  `<index>[*]</index> <trait>Custom Z-Indexes</trait> <value>${customZIndexCount}</value>\n` +
                  `<index>[*]</index> <trait>View Mode</trait> <value>${viewMode.toUpperCase()}</value>`,
                sequenceNumber: 0,
              });
            },
            catch: (error) => {
              console.error('Error generating preview stats:', error);
            },
          })
        );

        if (viewMode === '3d') {
          addMessage({
            type: 'info',
            message:
              `<nft>3D Mode Info</nft>\n` +
              `<index>[*]</index> <trait>Camera</trait> <value>${cameraType.toUpperCase()}</value>\n` +
              `<index>[*]</index> <trait>Controls</trait> <value>Use mouse to rotate, scroll to zoom</value>`,
            sequenceNumber: 0,
          });
        }
      }
    });

    void Effect.runPromise(messageEffect);
  }, [
    sortedImages,
    isGenerating,
    addMessage,
    orderedLayersSets,
    rarityConfig,
    activeSet,
    viewMode,
    cameraType,
    layers,
  ]);

  useEffect(() => {
    return () => {
      setMessages([]);
    };
  }, []);

  return { messages, formattedMessages };
};
