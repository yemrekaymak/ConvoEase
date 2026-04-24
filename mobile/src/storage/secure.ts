import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'convoease.tokens.v1';
const SETTINGS_KEY = 'convoease.settings.v1';

export type StoredTokens = {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAtUtc: string;
  refreshTokenExpiresAtUtc: string;
};

export type StoredSettings = {
  apiBaseUrl: string;
};

export async function getTokens(): Promise<StoredTokens | null> {
  const raw = await SecureStore.getItemAsync(TOKEN_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredTokens;
  } catch {
    return null;
  }
}

export async function setTokens(tokens: StoredTokens): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, JSON.stringify(tokens));
}

export async function clearTokens(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export async function getSettings(): Promise<StoredSettings | null> {
  const raw = await SecureStore.getItemAsync(SETTINGS_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredSettings;
  } catch {
    return null;
  }
}

export async function setSettings(settings: StoredSettings): Promise<void> {
  await SecureStore.setItemAsync(SETTINGS_KEY, JSON.stringify(settings));
}

