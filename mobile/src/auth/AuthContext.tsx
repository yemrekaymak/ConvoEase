import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiRequest, getApiBaseUrl } from '../api/client';
import type {
  AuthResponseDto,
  LoginRequestDto,
  RegisterRequestDto,
  UserSummaryDto,
} from '../api/types';
import { clearTokens, getTokens, setTokens } from '../storage/secure';

type AuthState =
  | { status: 'loading' }
  | { status: 'signed_out' }
  | { status: 'signed_in'; user: UserSummaryDto };

type AuthContextValue = {
  state: AuthState;
  apiBaseUrl: string;
  login: (req: LoginRequestDto) => Promise<UserSummaryDto>;
  register: (req: RegisterRequestDto) => Promise<UserSummaryDto>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading' });
  const [apiBaseUrl, setApiBaseUrlState] = useState('');

  useEffect(() => {
    (async () => {
      const baseUrl = await getApiBaseUrl();
      setApiBaseUrlState(baseUrl);
      const tokens = await getTokens();
      const refreshExpiry = tokens?.refreshTokenExpiresAtUtc
        ? new Date(tokens.refreshTokenExpiresAtUtc).getTime()
        : 0;

      if (tokens?.user && refreshExpiry > Date.now()) {
        setState({ status: 'signed_in', user: tokens.user });
        return;
      }

      await clearTokens();
      setState({ status: 'signed_out' });
    })();
  }, []);

  const applyAuth = useCallback(async (auth: AuthResponseDto) => {
    await setTokens({
      accessToken: auth.accessToken,
      refreshToken: auth.refreshToken,
      accessTokenExpiresAtUtc: auth.accessTokenExpiresAtUtc,
      refreshTokenExpiresAtUtc: auth.refreshTokenExpiresAtUtc,
      user: auth.user,
    });
    setState({ status: 'signed_in', user: auth.user });
  }, []);

  const login = useCallback(
    async (req: LoginRequestDto) => {
      const auth = await apiRequest<AuthResponseDto>('/api/auth/login', {
        method: 'POST',
        body: req,
        auth: false,
      });
      await applyAuth(auth);
      return auth.user;
    },
    [applyAuth]
  );

  const register = useCallback(
    async (req: RegisterRequestDto) => {
      const auth = await apiRequest<AuthResponseDto>('/api/auth/register', {
        method: 'POST',
        body: req,
        auth: false,
      });
      await applyAuth(auth);
      return auth.user;
    },
    [applyAuth]
  );

  const logout = useCallback(async () => {
    try {
      await apiRequest('/api/auth/logout', { method: 'POST' });
    } finally {
      await clearTokens();
      setState({ status: 'signed_out' });
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      state,
      apiBaseUrl,
      login,
      register,
      logout,
    }),
    [state, apiBaseUrl, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

