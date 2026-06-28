/* ============================================================
   Runtime server config — the backend base URL (REST + WS) the
   courier app talks to, obtained from the login QR and persisted
   (expo-secure-store). The build-time EXPO_PUBLIC_* values stay the
   fallback (see config.ts).

   This module is the source of truth for "which server am I paired
   with". On scan, provisioning.ts calls setServerBaseUrl(); the API
   client + WS read getServerBaseUrl() (falling back to build-time).
   Call loadServerConfig() once at app start to hydrate the cache.
   ============================================================ */
import * as SecureStore from 'expo-secure-store';

const KEY = 'alpha_courier_server';

let cachedBaseUrl: string | null = null;

/** http(s)://host:port → ws(s)://host:port (trailing slashes stripped). */
export function deriveWsUrl(baseUrl: string): string {
  return baseUrl.replace(/^http(s?):\/\//i, 'ws$1://').replace(/\/+$/, '');
}

/** Add a scheme if missing and strip trailing slashes. */
export function normalizeBaseUrl(raw: string): string {
  let u = (raw || '').trim().replace(/\/+$/, '');
  if (u && !/^https?:\/\//i.test(u)) u = `http://${u}`;
  return u;
}

/** Load the persisted base URL into the in-memory cache. Call once at start. */
export async function loadServerConfig(): Promise<string | null> {
  try {
    cachedBaseUrl = await SecureStore.getItemAsync(KEY);
  } catch {
    cachedBaseUrl = null;
  }
  return cachedBaseUrl;
}

/** The configured base URL, or null if the app isn't paired yet. */
export function getServerBaseUrl(): string | null {
  return cachedBaseUrl;
}

/** Persist + cache the paired server's base URL (normalized). */
export async function setServerBaseUrl(raw: string): Promise<string> {
  const url = normalizeBaseUrl(raw);
  cachedBaseUrl = url;
  try {
    await SecureStore.setItemAsync(KEY, url);
  } catch {
    /* best-effort: in-memory value still applies for this session */
  }
  return url;
}

/** Forget the paired server (e.g. on logout / re-pair). */
export async function clearServerBaseUrl(): Promise<void> {
  cachedBaseUrl = null;
  try {
    await SecureStore.deleteItemAsync(KEY);
  } catch {
    /* noop */
  }
}
