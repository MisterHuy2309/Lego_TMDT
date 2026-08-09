import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: 'ADMIN' | 'CLIENT';
  phone?: string;
  avatar_url?: string;
  street?: string;
  street_address?: string;
  ward?: string;
  district?: string;
  city?: string;
  addresses?: Array<{
    street?: string;
    ward?: string;
    district?: string;
    city?: string;
  }>;
}

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  setAuth: (user: UserProfile, token: string) => void;
  updateUser: (partialUser: Partial<UserProfile>) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,

      setAuth: (user, token) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('access_token', token);
          localStorage.setItem('user_info', JSON.stringify(user));
        }
        set({ user, token });
      },

      // 🟢 HÀM CẬP NHẬT USER VÀ ĐỒNG BỘ LOCALSTORAGE
      updateUser: (partialUser) => {
        set((state) => {
          if (!state.user) return state;
          const updatedUser = { ...state.user, ...partialUser };
          if (typeof window !== 'undefined') {
            localStorage.setItem('user_info', JSON.stringify(updatedUser));
          }
          return { user: updatedUser };
        });
      },

      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('access_token');
          localStorage.removeItem('user_info');
        }
        set({ user: null, token: null });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);