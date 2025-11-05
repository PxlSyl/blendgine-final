import type { CombinationsState as EffectCombinationsState } from '@/types/effect';

export type CombinationsState = EffectCombinationsState;

export interface CombinationsActions {
  calculatePossibleCombinations: (setId?: string) => Promise<number>;
  setPossibleCombinations: (count: number) => void;
}
