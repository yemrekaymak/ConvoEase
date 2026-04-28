import { NativeModules } from 'react-native';
import { clearTokens, getTokens, setTokens } from '../storage/secure';
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

const FALLBACK_API_BASE_URL = 'http://192.168.1.105:5136';

function getBundleHost(): string | null {
  const scriptURL = NativeModules?.SourceCode?.scriptURL as string | undefined;
  if (!scriptURL) return null;

  const match = scriptURL.match(/^(?:exp|exps|http|https):\/\/([^/:]+)(?::\d+)?/i);
  return match?.[1] ?? null;
}

function getDefaultApiBaseUrl(): string {
  const bundleHost = getBundleHost();
  if (bundleHost && bundleHost !== 'localhost' && bundleHost !== '127.0.0.1') {
    return `http://${bundleHost}:5136`;
  }

  return FALLBACK_API_BASE_URL;
}

let cachedBaseUrl: string | null = null;

export async function getApiBaseUrl(): Promise<string> {
  if (cachedBaseUrl) return cachedBaseUrl;
  cachedBaseUrl = getDefaultApiBaseUrl().replace(/\/+$/, '');
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
