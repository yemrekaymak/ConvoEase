import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiRequest, setApiBaseUrl } from '../api/client';
import type {
  AuthResponseDto,
  LoginRequestDto,
  RegisterRequestDto,
  UserSummaryDto,
} from '../api/types';
import { clearTokens, getSettings, getTokens, setTokens } from '../storage/secure';

type AuthState =
  | { status: 'loading' }
  | { status: 'signed_out' }
  | { status: 'signed_in'; user: UserSummaryDto };

type AuthContextValue = {
  state: AuthState;
  apiBaseUrl: string;
  setApiBaseUrl: (url: string) => Promise<void>;
  login: (req: LoginRequestDto) => Promise<void>;
  register: (req: RegisterRequestDto) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading' });
  const [apiBaseUrl, setApiBaseUrlState] = useState('http://192.168.1.160:5136');

  useEffect(() => {
    (async () => {
      const settings = await getSettings();
      if (settings?.apiBaseUrl) setApiBaseUrlState(settings.apiBaseUrl);
      const tokens = await getTokens();
      if (!tokens?.accessToken) {
        setState({ status: 'signed_out' });
        return;
      }
      // We don't have a "me" endpoint; treat as signed-in, user will be refreshed on next auth call.
      setState({ status: 'signed_in', user: { id: 'unknown', firstName: '', lastName: '', email: '', currentLevel: null } });
    })();
  }, []);

  const setBaseUrl = useCallback(async (url: string) => {
    await setApiBaseUrl(url);
    setApiBaseUrlState(url);
  }, []);

  const applyAuth = useCallback(async (auth: AuthResponseDto) => {
    await setTokens({
      accessToken: auth.accessToken,
      refreshToken: auth.refreshToken,
      accessTokenExpiresAtUtc: auth.accessTokenExpiresAtUtc,
      refreshTokenExpiresAtUtc: auth.refreshTokenExpiresAtUtc,
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
      setApiBaseUrl: setBaseUrl,
      login,
      register,
      logout,
    }),
    [state, apiBaseUrl, setBaseUrl, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

