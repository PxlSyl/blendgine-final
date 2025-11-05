import { create } from 'zustand';

import { api } from '@/services';
import { isTauriEventSystemAvailable } from '@/utils/tauri';

import {
  RulesMode,
  RulesModeSchema,
  RulesStateSchema,
  createDefaultRulesState,
} from '@/schemas/effect/rulesStore';

import type { RulesState, RulesActions } from '@/components/windows/rules/store/main/types';

import * as S from '@effect/schema/Schema';
import { useIncompatibilitiesStore } from '../incompatibilitiesStore';
import { useForcedCombinationStore } from '../forcedCombinationsStore';
import { effectUpdate } from '@/utils/effect/effectUpdater';
import { safeValidate } from '@/utils/effect/effectValidation';
import { EffectOrPromise, toPromise } from '@/utils/effect/effectPromiseUtils';

export const useRulesStore = create<RulesState & RulesActions>((set, get) => {
  const defaultState = createDefaultRulesState();

  return {
    ...defaultState,

    setActiveMode: (mode: RulesMode): EffectOrPromise<void> => {
      const validation = safeValidate(RulesModeSchema, mode);

      if (!validation.success) {
        console.warn('Invalid mode in setActiveMode:', validation.errors);
        return Promise.reject(new Error(`Invalid mode: ${validation.errors?.join(', ')}`));
      }

      effectUpdate(get, set, (state) => ({
        ...state,
        activeMode: mode,
      }));

      return Promise.resolve();
    },

    checkWindowStatus: (): EffectOrPromise<boolean> => {
      return api
        .isRulesWindowOpen()
        .then((isOpen) => {
          effectUpdate(get, set, (state) => ({
            ...state,
            isWindowOpen: isOpen,
          }));
          return isOpen;
        })
        .catch((error) => {
          console.error(error instanceof Error ? error.message : String(error));
          effectUpdate(get, set, (state) => ({
            ...state,
            isWindowOpen: false,
          }));
          return false;
        });
    },

    closeRulesWindow: (): EffectOrPromise<void> => {
      return api
        .closeRulesWindow()
        .then(() => {
          effectUpdate(get, set, (state) => ({
            ...state,
            isWindowOpen: false,
          }));
        })
        .catch((error) => {
          console.error(error instanceof Error ? error.message : String(error));
          return Promise.reject(error instanceof Error ? error : new Error(String(error)));
        });
    },

    openRulesWindow: (options: { mode?: RulesMode } = {}): EffectOrPromise<void> => {
      const mode = options.mode ?? 'incompatibilities';
      const newState = { initialMode: mode, activeMode: mode };

      return (async () => {
        try {
          const partialSchema = S.partial(RulesStateSchema);
          S.decodeSync(partialSchema)(newState);
          effectUpdate(get, set, (state) => ({ ...state, ...newState }));

          const incompatibilitiesStore = useIncompatibilitiesStore.getState();
          const forcedCombinationsStore = useForcedCombinationStore.getState();
          await toPromise(incompatibilitiesStore.initializeData());
          await toPromise(forcedCombinationsStore.initializeData());

          await api.openRulesWindow({ mode });
          effectUpdate(get, set, (state) => ({ ...state, isWindowOpen: true }));

          if (isTauriEventSystemAvailable()) {
            let unlisten: (() => void) | undefined = undefined;
            unlisten = api.onRulesWindowClosed(() => {
              effectUpdate(get, set, (state) => ({ ...state, isWindowOpen: false }));
              if (unlisten) {
                unlisten();
              }
            });
          }
        } catch (error) {
          effectUpdate(get, set, (state) => ({ ...state, isWindowOpen: false }));
          console.error(error instanceof Error ? error.message : String(error));
          throw error instanceof Error ? error : new Error(String(error));
        }
      })();
    },
  };
});
