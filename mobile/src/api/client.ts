import { clearTokens, getSettings, getTokens, setTokens } from '../storage/secure';
import type { AuthResponseDto, RefreshRequestDto } from './types';

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

const DEFAULT_API_BASE_URL = 'http://192.168.1.160:5136';

let cachedBaseUrl: string | null = null;

export async function getApiBaseUrl(): Promise<string> {
  if (cachedBaseUrl) return cachedBaseUrl;
  const s = await getSettings();
  cachedBaseUrl = (s?.apiBaseUrl ?? DEFAULT_API_BASE_URL).replace(/\/+$/, '');
  return cachedBaseUrl;
}

export async function setApiBaseUrl(url: string): Promise<void> {
  cachedBaseUrl = url.replace(/\/+$/, '');
  await (await import('../storage/secure')).setSettings({ apiBaseUrl: cachedBaseUrl });
}

async function doFetch(path: string, init: RequestInit): Promise<Response> {
  const base = await getApiBaseUrl();
  return fetch(`${base}${path}`, init);
}

async function parseJsonSafe(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

let refreshInFlight: Promise<void> | null = null;

async function refreshTokensIfNeeded(): Promise<void> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    const tokens = await getTokens();
    if (!tokens?.refreshToken) {
      await clearTokens();
      return;
    }

    const body: RefreshRequestDto = { refreshToken: tokens.refreshToken };
    const res = await doFetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = (await parseJsonSafe(res)) as AuthResponseDto | unknown;
    if (!res.ok) {
      await clearTokens();
      throw new ApiError('Refresh failed', res.status, data);
    }
    const auth = data as AuthResponseDto;
    await setTokens({
      accessToken: auth.accessToken,
      refreshToken: auth.refreshToken,
      accessTokenExpiresAtUtc: auth.accessTokenExpiresAtUtc,
      refreshTokenExpiresAtUtc: auth.refreshTokenExpiresAtUtc,
    });
  })().finally(() => {
    refreshInFlight = null;
  });

  return refreshInFlight;
}

export async function apiRequest<T>(
  path: string,
  opts?: { method?: string; body?: unknown; auth?: boolean }
): Promise<T> {
  const method = opts?.method ?? 'GET';
  const auth = opts?.auth ?? true;
  const body = opts?.body;

  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  if (auth) {
    const tokens = await getTokens();
    if (tokens?.accessToken) headers.Authorization = `Bearer ${tokens.accessToken}`;
  }

  let res = await doFetch(path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (auth && res.status === 401) {
    await refreshTokensIfNeeded();
    const tokens = await getTokens();
    const retryHeaders = { ...headers };
    if (tokens?.accessToken) retryHeaders.Authorization = `Bearer ${tokens.accessToken}`;
    res = await doFetch(path, {
      method,
      headers: retryHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  }

  const data = await parseJsonSafe(res);
  if (!res.ok) {
    const msg =
      typeof data === 'object' && data && 'message' in (data as any)
        ? String((data as any).message)
        : `Request failed (${res.status})`;
    throw new ApiError(msg, res.status, data);
  }
  return data as T;
}

