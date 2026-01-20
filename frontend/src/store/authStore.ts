// src/store/authStore.ts
import { create } from 'zustand';
import { Admin } from '@/lib/types';

interface AuthState {
  admin: Admin | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (admin: Admin, token: string) => void;
  logout: () => void;
  checkAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  admin: null,
  token: null,
  isAuthenticated: false,
  setAuth: (admin, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('admin', JSON.stringify(admin));
    set({ admin, token, isAuthenticated: true });
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('admin');
    set({ admin: null, token: null, isAuthenticated: false });
  },
  checkAuth: () => {
    const token = localStorage.getItem('token');
    const adminStr = localStorage.getItem('admin');
    if (token && adminStr) {
      const admin = JSON.parse(adminStr);
      set({ admin, token, isAuthenticated: true });
    }
  },
}));