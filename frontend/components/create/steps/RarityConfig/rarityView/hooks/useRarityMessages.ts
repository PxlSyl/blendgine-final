import { useMemo } from 'react';

import { useLayerOrder } from '@/components/store/layerOrder/hook';
import { useRarity } from '@/components/store/rarityStore/hook';

interface Message {
  id: number;
  timestamp: string;
  content: string;
  className: string;
}

export const useRarityMessages = (selectedLayer: string, activeSet: string) => {
  const { rarityConfig, sets } = useLayerOrder();
  const { isGlobalViewActive, getGlobalRarityData } = useRarity();

  const messages = useMemo(() => {
    if (!selectedLayer || !rarityConfig[selectedLayer]) {
      return [];
    }

    const layerConfig = rarityConfig[selectedLayer];
    const traits = layerConfig.traits ?? {};
    const result: Message[] = [];
    let id = 0;

    const timestamp = new Date().toLocaleTimeString();

    if (isGlobalViewActive) {
      const globalData = getGlobalRarityData(selectedLayer);

      result.push({
        id: id++,
        timestamp,
        content: `Analyzing layer <span class="text-[rgb(var(--color-primary))] font-bold">${selectedLayer}</span> with <span class="text-[rgb(var(--color-accent))] font-bold">Global View</span>`,
        className: 'text-[rgb(var(--color-accent))]',
      });

      const availableSets = Object.keys(sets);
      result.push({
        id: id++,
        timestamp,
        content: `Aggregating data from ${availableSets.length} set${availableSets.length > 1 ? 's' : ''}`,
        className: 'text-[rgb(var(--color-accent-light))]',
      });

      const activeSets = availableSets.filter((setId) => layerConfig.sets?.[setId]?.active);
      result.push({
        id: id++,
        timestamp,
        content: `Layer is active in ${activeSets.length} set${activeSets.length > 1 ? 's' : ''}`,
        className: 'text-[rgb(var(--color-accent-light))]',
      });

      const totalNFTs = Object.keys(sets).reduce((sum, setId) => {
        if (layerConfig.sets?.[setId]?.active) {
          return sum + (sets[setId].nftCount || 0);
        }
        return sum;
      }, 0);

      result.push({
        id: id++,
        timestamp,
        content: `Total NFTs used for calculation: ${totalNFTs}`,
        className: 'text-[rgb(var(--color-secondary))]',
      });

      if (globalData.length > 0) {
        const noneTrait = globalData.find((data) => data.traitName === 'None');

        if (noneTrait && noneTrait.rarity > 0) {
          result.push({
            id: id++,
            timestamp,
            content: `Skip probability: <span class="text-[rgb(var(--color-quaternary-light))]">${noneTrait.rarity.toFixed(2)}%</span>`,
            className: 'text-[rgb(var(--color-accent-light))]',
          });
        }

        result.push({
          id: id++,
          timestamp,
          content: `Global rarity distribution:`,
          className: 'text-[rgb(var(--color-accent))]',
        });

        globalData.forEach((data) => {
          if (data.traitName !== 'None') {
            result.push({
              id: id++,
              timestamp,
              content: `&nbsp;&nbsp;<span class="text-[rgb(var(--color-primary))]">└─</span> <span class="text-[rgb(var(--color-accent))]">${data.traitName}:</span> ${data.rarity.toFixed(2)}%`,
              className: 'text-[rgb(var(--color-quaternary-light))]',
            });
          }
        });

        const totalRarity = globalData.reduce((sum, data) => sum + data.rarity, 0);
        result.push({
          id: id++,
          timestamp,
          content: `<span class="font-bold">Total probability:</span> <span class="font-bold">${totalRarity.toFixed(2)}%</span>`,
          className:
            Math.abs(totalRarity - 100) < 0.1
              ? 'text-[rgb(var(--color-primary))]'
              : 'text-[rgb(var(--color-quaternary))]',
        });

        if (Math.abs(totalRarity - 100) > 0.1) {
          result.push({
            id: id++,
            timestamp,
            content: `Warning: Total probability should be 100% (currently ${totalRarity.toFixed(2)}%)`,
            className: 'text-[rgb(var(--color-quaternary))] font-bold',
          });
        }
      } else {
        result.push({
          id: id++,
          timestamp,
          content: `No traits are enabled in any set for this layer.`,
          className: 'text-[rgb(var(--color-quinary))]',
        });
      }

      return result;
    }

    const activatedTraits = Object.entries(traits || {}).filter(
      ([, config]) => config.sets?.[activeSet]?.enabled === true
    );

    const totalValue = activatedTraits.reduce((sum, [, config]) => {
      return sum + (config.sets?.[activeSet]?.value ?? 0);
    }, 0);

    result.push({
      id: id++,
      timestamp,
      content: `Analyzing layer <span class="text-[rgb(var(--color-primary))] font-bold">${selectedLayer}</span> for <span class="text-[rgb(var(--color-primary-dark))] font-bold">Set ${activeSet.replace('set', '')}</span>`,
      className: 'text-[rgb(var(--color-accent))]',
    });

    result.push({
      id: id++,
      timestamp,
      content: `<span class="text-[rgb(var(--color-accent))]">Number of activated traits:</span> <span class="text-[rgb(var(--color-primary))] font-bold">${activatedTraits.length}</span>`,
      className: '',
    });

    const lockedTraits = activatedTraits.filter(([, config]) => config.sets?.[activeSet]?.locked);

    if (lockedTraits.length > 0) {
      result.push({
        id: id++,
        timestamp,
        content: `Found ${lockedTraits.length} locked trait${lockedTraits.length > 1 ? 's' : ''}:`,
        className: 'text-[rgb(var(--color-quinary))]',
      });
      lockedTraits.forEach(([trait, config]) => {
        result.push({
          id: id++,
          timestamp,
          content: `&nbsp;&nbsp;- <span class="text-[rgb(var(--color-accent))]">${trait}:</span> ${config.sets?.[activeSet]?.value.toFixed(2)}%`,
          className: 'text-[rgb(var(--color-quaternary-light))]',
        });
      });
    }

    const noneConfig = traits?.['None'];
    if (noneConfig?.sets?.[activeSet]?.enabled) {
      result.push({
        id: id++,
        timestamp,
        content: `Skip probability: <span class="text-[rgb(var(--color-quaternary-light))]">${noneConfig.sets[activeSet].value.toFixed(2)}%</span>`,
        className: 'text-[rgb(var(--color-accent-light))]',
      });
    }

    const enabledTraits = activatedTraits.filter(
      ([trait, config]) => trait !== 'None' && !config.sets?.[activeSet]?.locked
    );

    if (enabledTraits.length > 0) {
      result.push({
        id: id++,
        timestamp,
        content: `Active traits:`,
        className: 'text-[rgb(var(--color-primary))]',
      });
      enabledTraits.forEach(([trait, config]) => {
        result.push({
          id: id++,
          timestamp,
          content: `&nbsp;&nbsp;<span class="text-[rgb(var(--color-primary))]">└─</span> <span class="text-[rgb(var(--color-accent))]">${trait}:</span> ${config.sets?.[activeSet]?.value.toFixed(2)}%`,
          className: 'text-[rgb(var(--color-quaternary-light))]',
        });
      });
    }

    result.push({
      id: id++,
      timestamp,
      content: `<span class="font-bold">Total probability:</span> <span class="font-bold">${totalValue.toFixed(2)}%</span>`,
      className:
        Math.abs(totalValue - 100) < 0.1
          ? 'text-[rgb(var(--color-primary))]'
          : 'text-[rgb(var(--color-quaternary))]',
    });

    if (Math.abs(totalValue - 100) > 0.1) {
      result.push({
        id: id++,
        timestamp,
        content: `Warning: Total probability should be 100% (currently ${totalValue.toFixed(2)}%)`,
        className: 'text-[rgb(var(--color-quaternary))] font-bold',
      });
    }

    return result;
  }, [selectedLayer, rarityConfig, activeSet, isGlobalViewActive, getGlobalRarityData, sets]);

  return { messages };
};
