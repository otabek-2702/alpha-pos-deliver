/* ============================================================
   QR generation — ported from app/payments-data.js.
   • payLink(): dynamic pay-link payload (amount in tiyin).
   • qrMatrix(): deterministic QR-style matrix (faithful-looking
     placeholder). PRODUCTION must encode the REAL link returned by
     the backend's create_payment (see BACKEND_INTEGRATION.md §3).
   ============================================================ */
import type { PaymentProvider } from '@/api/types';

const PROVIDER_BASE: Partial<Record<PaymentProvider, string>> = {
  payme: 'https://checkout.paycom.uz/',
  click: 'https://my.click.uz/services/pay?',
  uzum: 'https://www.uzumbank.uz/open-service?',
  paynet: 'https://paynet.uz/checkout/',
};

export function payLink(order: { id: number; total: number }, provider: PaymentProvider): string {
  const base = PROVIDER_BASE[provider] ?? 'https://pay.alphapos.uz/';
  const tiyin = order.total * 100;
  return base + 'id=ALP' + order.id + '&a=' + tiyin + '&t=' + Date.now().toString(36);
}

/** Deterministic QR-style matrix with three finder patterns. */
export function qrMatrix(str: string, size = 29): number[][] {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  const rnd = (): number => {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    h >>>= 0;
    return h / 4294967296;
  };
  const m: number[][] = [];
  for (let r = 0; r < size; r++) m.push(new Array<number>(size).fill(0));
  const finder = (or: number, oc: number): void => {
    for (let rr = 0; rr < 7; rr++)
      for (let cc = 0; cc < 7; cc++) {
        const edge = rr === 0 || rr === 6 || cc === 0 || cc === 6;
        const core = rr >= 2 && rr <= 4 && cc >= 2 && cc <= 4;
        m[or + rr]![oc + cc] = -(edge || core ? 1 : 2); // reserved (neg)
      }
  };
  finder(0, 0);
  finder(0, size - 7);
  finder(size - 7, 0);
  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++) {
      const v = m[r]![c]!;
      if (v < 0) {
        m[r]![c] = v === -1 ? 1 : 0;
        continue;
      }
      m[r]![c] = rnd() > 0.5 ? 1 : 0;
    }
  return m;
}
