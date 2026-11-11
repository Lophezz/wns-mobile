import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from 'jwt-decode';
import { Platform } from 'react-native';
import { AXIOS_INSTANCE } from '../api/axios-instance';

interface JwtPayload {
  sub?: string;
  role?: string;
  roles?: string[];
  authorities?: string[];
  scope?: string;
  exp?: number;
}

export type UserRole = 'ALUNO' | 'ADMIN';

interface AuthState {
  token: string | null;
  email: string | null;
  role: UserRole | null;
  isHydrated: boolean;
  syncAuthFromStorage: (fallbackEmail?: string) => Promise<UserRole | null>;
  logout: () => Promise<void>;
}

// Storage Universal (Web + Mobile)
const Storage = {
  getItem: async (key: string) => {
    if (Platform.OS === 'web') return localStorage.getItem(key);
    return await SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string) => {
    if (Platform.OS === 'web') localStorage.setItem(key, value);
    else await SecureStore.setItemAsync(key, value);
  },
  removeItem: async (key: string) => {
    if (Platform.OS === 'web') localStorage.removeItem(key);
    else await SecureStore.deleteItemAsync(key);
  },
};

const checkRoleInPayload = (decoded: JwtPayload): UserRole | null => {
  const candidates = [
    decoded.role,
    ...(decoded.roles || []),
    ...(decoded.authorities || []),
    decoded.scope,
  ]
    .filter(Boolean)
    .join(' ')
    .toUpperCase();

  if (candidates.includes('ADMIN')) return 'ADMIN';
  if (candidates.includes('ALUNO') || candidates.includes('USER')) return 'ALUNO';
  return null;
};

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  email: null,
  role: null,
  isHydrated: false,

  syncAuthFromStorage: async (fallbackEmail?: string) => {
    try {
      let token = await Storage.getItem('wns_access_token');
      const savedEmail = fallbackEmail || (await Storage.getItem('wns_user_email'));
      const savedRole = (await Storage.getItem('wns_user_role')) as UserRole | null;

      if (fallbackEmail) {
        await Storage.setItem('wns_user_email', fallbackEmail);
      }

      let detectedRole: UserRole | null = null;
      let detectedEmail: string | null = savedEmail;

      if (token && token !== 'cookie-session') {
        try {
          const decoded = jwtDecode<JwtPayload>(token);
          if (decoded.exp && decoded.exp * 1000 < Date.now()) {
            await Storage.removeItem('wns_access_token');
            await Storage.removeItem('wns_user_role');
            set({ token: null, email: null, role: null, isHydrated: true });
            return null;
          }
          detectedRole = checkRoleInPayload(decoded);
          detectedEmail = decoded.sub || savedEmail;
        } catch {
          // Segue para API
        }
      }

      if (fallbackEmail || (!detectedRole && savedRole)) {
        if (!fallbackEmail && savedRole) {
          detectedRole = savedRole;
        } else {
          try {
            await AXIOS_INSTANCE.get('/auth/pesquisar', {
              params: { page: 0, size: 1 },
            });
            detectedRole = 'ADMIN';
          } catch (err: any) {
            const status = err?.response?.status;
            if (status === 403) detectedRole = 'ALUNO';
            else if (fallbackEmail?.toLowerCase().trim() === 'contato@escolawns.com.br') detectedRole = 'ADMIN';
            else detectedRole = 'ALUNO';
          }
        }
      }

      if (!detectedRole) {
        set({ token: null, email: null, role: null, isHydrated: true });
        return null;
      }

      const finalToken = token || 'cookie-session';
      await Storage.setItem('wns_access_token', finalToken);
      await Storage.setItem('wns_user_role', detectedRole);

      set({ token: finalToken, email: detectedEmail, role: detectedRole, isHydrated: true });
      return detectedRole;
    } catch {
      set({ token: null, email: null, role: null, isHydrated: true });
      return null;
    }
  },

  logout: async () => {
    await Storage.removeItem('wns_access_token');
    await Storage.removeItem('wns_user_email');
    await Storage.removeItem('wns_user_role');
    set({ token: null, email: null, role: null, isHydrated: true });
  },
}));