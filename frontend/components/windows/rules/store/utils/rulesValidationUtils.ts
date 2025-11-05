import * as O from 'effect/Option';

import type { RarityConfig } from '@/types/effect';

import { memoize } from '@/utils/effect/effectMemoize';

export const isLayerTraitValid = memoize(
  (activeSet: string, category: string, item: string, rarityConfig?: RarityConfig): boolean => {
    if (!rarityConfig) {
      return false;
    }

    const enabled = O.fromNullable(
      rarityConfig[category]?.traits?.[item]?.sets?.[activeSet]?.enabled
    );
    return O.getOrNull(enabled) ?? false;
  },

  (activeSet: string, category: string, item: string, rarityConfig?: RarityConfig) => {
    if (!rarityConfig) {
      return `${activeSet}-${category}-${item}-undefined`;
    }

    return `${activeSet}-${category}-${item}-${rarityConfig[category]?.traits?.[item]?.sets?.[activeSet]?.enabled}`;
  }
);
