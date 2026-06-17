/* ============================================================
   Runtime config — REST + WS base URLs and the mock switch.
   Reads EXPO_PUBLIC_* (inlined at build) with an expo-constants
   `extra` fallback. Blank API URL OR EXPO_PUBLIC_USE_MOCK=true →
   the app runs entirely on typed fixtures + the fake WS emitter.
   ============================================================ */
import Constants from 'expo-constants';

type Extra = { apiBaseUrl?: string; wsBaseUrl?: string; useMock?: boolean };
const extra = (Constants.expoConfig?.extra ?? {}) as Extra;

export const API_BASE_URL: string = process.env.EXPO_PUBLIC_API_BASE_URL ?? extra.apiBaseUrl ?? '';

export const WS_BASE_URL: string = process.env.EXPO_PUBLIC_WS_BASE_URL ?? extra.wsBaseUrl ?? '';

const forceMock = process.env.EXPO_PUBLIC_USE_MOCK === 'true' || extra.useMock === true;

/** True when there is no backend to talk to (or mock is forced). */
export const USE_MOCK: boolean = forceMock || API_BASE_URL.length === 0;

/** Courier realtime socket path (BACKEND_INTEGRATION.md §4/§11). */
export const COURIER_WS_PATH = '/ws/courier/';
