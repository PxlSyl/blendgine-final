import { useMemo, useEffect, useState } from 'react';

import { useColorStore } from '@/components/store/randomUI';
import { useLayerOrder } from '@/components/store/layerOrder/hook';
import { useRarity } from '@/components/store/rarityStore/hook';
import { useStore } from '@/components/store';

interface TraitData {
  trait: string;
  value: number;
  percentage: number;
  color: string;
}

export const useLayerTraitsData = (
  selectedLayer: string,
  activeSet: string,
  isGlobal: boolean = false
): TraitData[] => {
  const { rarityConfig } = useLayerOrder();
  const { getGlobalRarityData } = useRarity();
  const { getColorForKey } = useColorStore();
  const { themeName } = useStore();
  const [traitData, setTraitData] = useState<TraitData[]>([]);

  const baseData = useMemo(() => {
    if (!selectedLayer) {
      return [];
    }

    if (isGlobal) {
      const globalRarityData = getGlobalRarityData(selectedLayer);
      return globalRarityData
        .filter((item) => item.rarity > 0)
        .map((item) => ({
          trait: item.traitName,
          value: item.rarity,
          percentage: item.rarity,
          color: '#000000',
        }));
    }

    if (!rarityConfig[selectedLayer]?.traits) {
      return [];
    }

    const totalValue: number = Object.values(rarityConfig[selectedLayer].traits).reduce(
      (sum: number, config) => {
        const isEnabled = config.sets?.[activeSet]?.enabled ?? false;
        return isEnabled ? sum + (config.sets?.[activeSet]?.value ?? 0) : sum;
      },
      0
    );

    const enabledTraits = Object.entries(rarityConfig[selectedLayer].traits)
      .filter(([, config]) => {
        return config.sets?.[activeSet]?.enabled ?? false;
      })
      .map(([trait, config]) => ({
        trait,
        value: config.sets?.[activeSet]?.value ?? 0,
        percentage: ((config.sets?.[activeSet]?.value ?? 0) / totalValue) * 100,
        color: '#000000',
      }));

    return enabledTraits.sort((a, b) => b.value - a.value);
  }, [selectedLayer, activeSet, rarityConfig, getGlobalRarityData, isGlobal]);

  useEffect(() => {
    const dataWithColors = baseData.map((item) => ({
      ...item,
      color: getColorForKey(`${selectedLayer}-${item.trait}`),
    }));
    setTraitData(dataWithColors);
  }, [baseData, selectedLayer, getColorForKey, themeName]);

  return traitData;
};
