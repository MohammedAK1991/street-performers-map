import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, AuthResponse, LoginCredentials, RegisterData } from '@spm/shared-types';
import { ApiClient, api } from '@/utils/api';

interface AuthState {
  // State
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  
  // Getters
  isAuthenticated: boolean;
  isPerformer: boolean;
  isAudience: boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      token: null,
      isLoading: false,
      error: null,

      // Computed getters
      get isAuthenticated() {
        return !!get().token && !!get().user;
      },
      
      get isPerformer() {
        return get().user?.role === 'performer';
      },
      
      get isAudience() {
        return get().user?.role === 'audience';
      },

      // Actions
      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true, error: null });
        
        try {
          const authResponse = await ApiClient.call<AuthResponse>(
            api.post('/users/login', credentials)
          );
          
          // Store token in localStorage for API interceptor
          localStorage.setItem('auth-token', authResponse.token);
          
          set({
            user: authResponse.user,
            token: authResponse.token,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Login failed';
          set({
            isLoading: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      register: async (userData: RegisterData) => {
        set({ isLoading: true, error: null });
        
        try {
          const authResponse = await ApiClient.call<AuthResponse>(
            api.post('/users/register', userData)
          );
          
          // Store token in localStorage for API interceptor
          localStorage.setItem('auth-token', authResponse.token);
          
          set({
            user: authResponse.user,
            token: authResponse.token,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Registration failed';
          set({
            isLoading: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      logout: () => {
        // Clear localStorage
        localStorage.removeItem('auth-token');
        localStorage.removeItem('user');
        
        set({
          user: null,
          token: null,
          error: null,
        });
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'auth-storage', // localStorage key
      partialize: (state) => ({
        user: state.user,
        token: state.token,
      }),
      // Rehydrate token to localStorage on app start
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          localStorage.setItem('auth-token', state.token);
        }
      },
    }
  )
);
