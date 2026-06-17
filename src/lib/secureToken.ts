/* ============================================================
   Auth token storage — expo-secure-store (Keychain / Keystore).
   No secret is ever committed; the courier logs in to obtain it.
   ============================================================ */
import * as SecureStore from 'expo-secure-store';

const KEY = 'alpha_courier_token';

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
}
