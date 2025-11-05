import type { Effect } from 'effect/Effect';

import type { RulesState, RulesMode } from '@/types/effect';

export type { RulesState };

export type EffectOrPromise<T, E = Error> =
  | Promise<T>
  | Effect<T, E, never>
  | ((...args: unknown[]) => Promise<T> | Effect<T, E, never>);

export interface RulesActions {
  openRulesWindow: (options?: { mode?: RulesMode }) => EffectOrPromise<void>;
  closeRulesWindow: () => EffectOrPromise<void>;
  checkWindowStatus: () => EffectOrPromise<boolean>;
  setActiveMode: (mode: RulesMode) => EffectOrPromise<void>;
}
