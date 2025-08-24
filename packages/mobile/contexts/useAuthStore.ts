import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthState {
  token: string | null;
  setToken: (token: string | null) => Promise<void>;
  hydrate: () => Promise<void>;
}

const TOKEN_KEY = 'auth_token';

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  setToken: async (token: string | null) => {
    if (token) {
      await AsyncStorage.setItem(TOKEN_KEY, token);
    } else {
      await AsyncStorage.removeItem(TOKEN_KEY);
    }
    set({ token });
  },
  hydrate: async () => {
    const stored = await AsyncStorage.getItem(TOKEN_KEY);
    set({ token: stored });
  },
}));


