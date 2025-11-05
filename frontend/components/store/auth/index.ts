import { create } from 'zustand';
import { AuthState, AuthActions } from './types';

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  loading: false,
  error: null,
};

export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  ...initialState,

  login: async (email: string, password: string) => {
    try {
      set({ loading: true, error: null });

      // TODO: Implement actual API call when backend is ready
      // const response = await api.login(email, password);

      // Simulate API call for now
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (email && password) {
        set({
          isAuthenticated: true,
          user: {
            email,
            name: email.split('@')[0], // Example: extract name from email
          },
          loading: false,
        });
      } else {
        throw new Error('Invalid credentials');
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'An error occurred during login',
        loading: false,
      });
    }
  },

  logout: async () => {
    try {
      set({ loading: true });

      // TODO: Implement actual API call when backend is ready
      // await api.logout();

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      set({
        ...initialState,
        loading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'An error occurred during logout',
        loading: false,
      });
    }
  },

  clearError: () => {
    set({ error: null });
  },

  setLoading: (loading: boolean) => {
    set({ loading });
  },
}));
