/* ============================================================
   Navigation handoff — open the drop-off in an external maps app
   via Linking.canOpenURL → openURL, with a fallback chain:
   Yandex Navigator → 2GIS → Google Maps (web). Text-only addresses
   (no coords) fall back to a maps search on the address string.
   ============================================================ */
import { Linking } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import type { Address } from '@/api/types';

export type NavApp = 'yandexnav' | 'yandexmaps' | 'google' | '2gis';

type Urls = { native?: string; web: string };

function urlsFor(app: NavApp, addr: Address): Urls {
  const c = addr.coords;
  const q = encodeURIComponent(addr.text);
  switch (app) {
    case 'yandexnav':
      return {
        native: c ? `yandexnavi://build_route_on_map?lat_to=${c.lat}&lon_to=${c.lng}` : undefined,
        web: c
          ? `https://yandex.com/maps/?rtext=~${c.lat},${c.lng}&rtt=auto`
          : `https://yandex.com/maps/?text=${q}`,
      };
    case 'yandexmaps':
      return {
        native: c ? `yandexmaps://maps.yandex.ru/?pt=${c.lng},${c.lat}&z=16&l=map` : undefined,
        web: c
          ? `https://yandex.com/maps/?pt=${c.lng},${c.lat}&z=16&l=map`
          : `https://yandex.com/maps/?text=${q}`,
      };
    case 'google':
      return {
        native: c ? `comgooglemaps://?daddr=${c.lat},${c.lng}&directionsmode=driving` : undefined,
        web: c
          ? `https://www.google.com/maps/dir/?api=1&destination=${c.lat},${c.lng}`
          : `https://www.google.com/maps/search/?api=1&query=${q}`,
      };
    case '2gis':
      return {
        native: c ? `dgis://2gis.ru/routeSearch/rsType/car/to/${c.lng},${c.lat}` : undefined,
        web: c
          ? `https://2gis.ru/directions/points/|${c.lng},${c.lat}`
          : `https://2gis.ru/search/${q}`,
      };
  }
}

async function tryOpen(url?: string): Promise<boolean> {
  if (!url) return false;
  try {
    if (await Linking.canOpenURL(url)) {
      await Linking.openURL(url);
      return true;
    }
  } catch {
    // fall through
  }
  return false;
}

/** Open one specific app; if its native scheme is unavailable, use its web URL. */
export async function openNavApp(app: NavApp, addr: Address): Promise<void> {
  const { native, web } = urlsFor(app, addr);
  if (await tryOpen(native)) return;
  await tryOpen(web);
}

/**
 * Fallback chain for a one-tap "navigate": Yandex Navigator → 2GIS →
 * Google Maps web. Returns the app that actually opened.
 */
export async function openRoute(addr: Address): Promise<NavApp | 'google-web'> {
  if (await tryOpen(urlsFor('yandexnav', addr).native)) return 'yandexnav';
  if (await tryOpen(urlsFor('2gis', addr).native)) return '2gis';
  await tryOpen(urlsFor('google', addr).web);
  return 'google-web';
}

export async function copyAddress(addr: Address): Promise<void> {
  const text = addr.coords ? `${addr.text} (${addr.coords.lat}, ${addr.coords.lng})` : addr.text;
  await Clipboard.setStringAsync(text);
}
