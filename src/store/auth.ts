import { create } from 'zustand';
import { authApi } from '@/lib/api';

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  mustChangePassword?: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  mustChangePassword: boolean;
  loading: boolean;
  login: (username: string, password: string) => Promise<{ mustChangePassword: boolean }>;
  register: (username: string, password: string, email: string) => Promise<void>;
  logout: () => void;
  fetchMe: () => Promise<void>;
  setToken: (token: string) => void;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
  tryRefreshToken: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('token'),
  refreshToken: localStorage.getItem('refreshToken'),
  isAuthenticated: !!localStorage.getItem('token'),
  isAdmin: false,
  mustChangePassword: false,
  loading: false,

  login: async (username: string, password: string) => {
    set({ loading: true });
    try {
      const data = await authApi.login(username, password);
      localStorage.setItem('token', data.token);
      localStorage.setItem('refreshToken', data.refreshToken);
      const mustChange = !!data.user?.mustChangePassword;
      set({
        token: data.token,
        refreshToken: data.refreshToken,
        user: data.user,
        isAuthenticated: true,
        isAdmin: data.user?.role === 'admin',
        mustChangePassword: mustChange,
        loading: false,
      });
      return { mustChangePassword: mustChange };
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  register: async (username: string, password: string, email: string) => {
    set({ loading: true });
    try {
      const data = await authApi.register(username, password, email);
      localStorage.setItem('token', data.token);
      localStorage.setItem('refreshToken', data.refreshToken);
      set({
        token: data.token,
        refreshToken: data.refreshToken,
        user: data.user,
        isAuthenticated: true,
        isAdmin: data.user?.role === 'admin',
        mustChangePassword: false,
        loading: false,
      });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    set({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isAdmin: false,
      mustChangePassword: false,
    });
  },

  fetchMe: async () => {
    if (!get().token) return;
    set({ loading: true });
    try {
      const user = await authApi.me();
      set({
        user,
        isAuthenticated: true,
        isAdmin: user?.role === 'admin',
        mustChangePassword: !!user?.mustChangePassword,
        loading: false,
      });
    } catch {
      try {
        const refreshed = await get().tryRefreshToken();
        if (!refreshed) {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          set({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
            isAdmin: false,
            mustChangePassword: false,
            loading: false,
          });
        } else {
          set({ loading: false });
        }
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          isAdmin: false,
          mustChangePassword: false,
          loading: false,
        });
      }
    }
  },

  setToken: (token: string) => {
    localStorage.setItem('token', token);
    set({ token, isAuthenticated: true });
  },

  changePassword: async (oldPassword: string, newPassword: string) => {
    await authApi.changePassword(oldPassword, newPassword);
    set({ mustChangePassword: false });
  },

  tryRefreshToken: async (): Promise<boolean> => {
    const storedRefreshToken = get().refreshToken || localStorage.getItem('refreshToken');
    if (!storedRefreshToken) return false;
    try {
      const data = await authApi.refresh(storedRefreshToken);
      localStorage.setItem('token', data.token);
      set({
        token: data.token,
        isAuthenticated: true,
        isAdmin: data.user?.role === 'admin',
      });
      return true;
    } catch {
      return false;
    }
  },
}));
