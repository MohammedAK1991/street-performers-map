import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@spm/shared-types';
import { ApiClient, api } from '@/utils/api';

interface ClerkAuthState {
  // State
  user: User | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  clearUser: () => void;
  syncUserWithBackend: (clerkUser: {
    id: string;
    email: string;
    username?: string | null;
    displayName?: string | null;
    avatar?: string | null;
    role?: 'performer' | 'audience';
  }) => Promise<void>;
  
  // Getters
  isAuthenticated: boolean;
  isPerformer: boolean;
  isAudience: boolean;
}

export const useClerkAuthStore = create<ClerkAuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isLoading: false,
      error: null,

      // Computed getters
      get isAuthenticated() {
        return !!get().user;
      },
      
      get isPerformer() {
        return get().user?.role === 'performer';
      },
      
      get isAudience() {
        return get().user?.role === 'audience';
      },

      // Actions
      setUser: (user: User | null) => {
        set({ user, error: null });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      setError: (error: string | null) => {
        set({ error });
      },

      clearError: () => {
        set({ error: null });
      },

      clearUser: () => {
        set({
          user: null,
          isLoading: false,
          error: null,
        });
      },

      syncUserWithBackend: async (clerkUser) => {
        try {
          set({ isLoading: true, error: null });
          
          // Ensure we have a valid displayName
          const displayName = clerkUser.displayName || clerkUser.username || 'User';
          console.log('Syncing user with displayName:', displayName);
          
          const response = await ApiClient.call<{ data: User }>(
            api.post('/users/sync-clerk', {
              clerkId: clerkUser.id,
              email: clerkUser.email,
              username: clerkUser.username,
              displayName: displayName,
              avatar: clerkUser.avatar,
              role: clerkUser.role || 'audience', // Default to audience if no role provided
            })
          );
          
          console.log('Sync response:', response);
          console.log('Setting user:', response.data);
          
          set({ user: response.data, isLoading: false });
        } catch (error) {
          console.error('Failed to sync Clerk user with backend:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to sync user',
            isLoading: false 
          });
        }
      },
    }),
    {
      name: 'clerk-auth-storage', // localStorage key
      partialize: (state) => ({
        user: state.user,
      }),
    }
  )
);
