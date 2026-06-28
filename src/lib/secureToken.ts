/* ============================================================
   Auth token storage — expo-secure-store (Keychain / Keystore).
   No secret is ever committed; the courier logs in to obtain it.
   ============================================================ */
import * as SecureStore from 'expo-secure-store';

const KEY = 'alpha_courier_token';
const EXP_KEY = 'alpha_courier_token_exp';

export async function getToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(KEY);
  } catch {
    return null;
  }
}

export async function setToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(KEY, token);
}

export async function clearToken(): Promise<void> {
  await SecureStore.deleteItemAsync(KEY);
  try {
    await SecureStore.deleteItemAsync(EXP_KEY);
  } catch {
    /* noop */
  }
}

/* ---- token expiry (backend returns expires_at on login) ---- */

/** Persist the token's expiry (ISO8601), or clear it when null. */
export async function setTokenExpiry(expiresAt: string | null): Promise<void> {
  try {
    if (expiresAt) await SecureStore.setItemAsync(EXP_KEY, expiresAt);
    else await SecureStore.deleteItemAsync(EXP_KEY);
  } catch {
    /* best-effort */
  }
}

export async function getTokenExpiry(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(EXP_KEY);
  } catch {
    return null;
  }
}

/** True once the stored expiry has passed. No expiry info → treat as valid
    (a 401 from the server is the backstop and triggers re-login). */
export async function isTokenExpired(): Promise<boolean> {
  const exp = await getTokenExpiry();
  if (!exp) return false;
  const t = Date.parse(exp);
  return Number.isFinite(t) && t <= Date.now();
}
