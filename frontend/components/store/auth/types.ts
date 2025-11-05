import { AuthState as EffectAuthState } from '@/types/effect';

export type AuthState = EffectAuthState;

export interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}
