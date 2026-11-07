import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from 'jwt-decode';
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
      let token = await SecureStore.getItemAsync('wns_access_token');
      const savedEmail = fallbackEmail || (await SecureStore.getItemAsync('wns_user_email'));
      const savedRole = (await SecureStore.getItemAsync('wns_user_role')) as UserRole | null;

      if (fallbackEmail) {
        await SecureStore.setItemAsync('wns_user_email', fallbackEmail);
      }

      let detectedRole: UserRole | null = null;
      let detectedEmail: string | null = savedEmail;

      // 1. Tenta ler a role de dentro do JWT caso o Axios tenha capturado o token
      if (token && token !== 'cookie-session') {
        try {
          const decoded = jwtDecode<JwtPayload>(token);
          if (decoded.exp && decoded.exp * 1000 < Date.now()) {
            await SecureStore.deleteItemAsync('wns_access_token');
            await SecureStore.deleteItemAsync('wns_user_role');
            set({ token: null, email: null, role: null, isHydrated: true });
            return null;
          }
          detectedRole = checkRoleInPayload(decoded);
          detectedEmail = decoded.sub || savedEmail;
        } catch {
          // Segue para verificação via API
        }
      }

      // 2. Se estamos no momento do login (fallbackEmail presente) ou sem role definida,
      // testamos a rota exclusiva de ADMIN (/auth/pesquisar) que usa o Cookie HttpOnly nativo!
      if (fallbackEmail || (!detectedRole && savedRole)) {
        if (!fallbackEmail && savedRole) {
          detectedRole = savedRole;
        } else {
          try {
            await AXIOS_INSTANCE.get('/auth/pesquisar', {
              params: { page: 0, size: 1 },
            });
            // Se retornou 200 OK, o Spring Security confirmou que tem ROLE_ADMIN!
            detectedRole = 'ADMIN';
          } catch (err: any) {
            const status = err?.response?.status;
            if (status === 403) {
              // 403 Forbidden significa que está logado, mas é ALUNO!
              detectedRole = 'ALUNO';
            } else if (
              fallbackEmail?.toLowerCase().trim() === 'contato@escolawns.com.br'
            ) {
              detectedRole = 'ADMIN';
            } else {
              detectedRole = 'ALUNO';
            }
          }
        }
      }

      if (!detectedRole) {
        set({ token: null, email: null, role: null, isHydrated: true });
        return null;
      }

      const finalToken = token || 'cookie-session';
      await SecureStore.setItemAsync('wns_access_token', finalToken);
      await SecureStore.setItemAsync('wns_user_role', detectedRole);

      set({
        token: finalToken,
        email: detectedEmail,
        role: detectedRole,
        isHydrated: true,
      });

      return detectedRole;
    } catch {
      set({ token: null, email: null, role: null, isHydrated: true });
      return null;
    }
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('wns_access_token');
    await SecureStore.deleteItemAsync('wns_user_email');
    await SecureStore.deleteItemAsync('wns_user_role');
    set({ token: null, email: null, role: null, isHydrated: true });
  },
}));