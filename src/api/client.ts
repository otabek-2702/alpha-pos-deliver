/* ============================================================
   Typed API client. In mock mode every call resolves the fixtures
   (and still validates them through zod, so the mock can't drift
   from the schema). In real mode it fetches the Django/DRF backend
   and parses responses with zod. Token comes from secure-store.
   ============================================================ */
import { z } from 'zod';
import * as fx from '@/data/fixtures';
import { getToken } from '@/lib/secureToken';
import { payLink } from '@/lib/qr';
import { mockEmit } from '@/realtime/ws';
import { API_BASE_URL, USE_MOCK } from './config';
import {
  activeOrderSchema,
  completedOrderSchema,
  createPaymentResponseSchema,
  reconciliationApiSchema,
  validate,
  type CreatePaymentResponse,
} from './schemas';
import type {
  ActiveOrder,
  CompletedOrder,
  Courier,
  CourierNotification,
  LedgerEntry,
  PaymentProvider,
  Reconciliation,
  Stats,
  Step,
} from './types';

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

async function api<T>(path: string, schema: z.ZodType<T>, init?: RequestInit): Promise<T> {
  const token = await getToken();
  const res = await fetch(API_BASE_URL.replace(/\/+$/, '') + path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Token ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) throw new Error(`API ${path} → ${res.status}`);
  return validate(schema, await res.json(), path);
}

/* ---- auth ---- */
export async function login(opts: {
  phone?: string;
  password?: string;
  qr?: string;
}): Promise<string> {
  if (USE_MOCK) {
    await sleep(150);
    return 'mock-courier-token';
  }
  const res = await api('/auth/courier/login/', z.object({ token: z.string() }), {
    method: 'POST',
    body: JSON.stringify(opts),
  });
  return res.token;
}

/* ---- read models ---- */
export async function getCourier(): Promise<Courier> {
  if (USE_MOCK) {
    await sleep(60);
    return fx.courier;
  }
  return api('/courier/me/', courierSchema);
}

export async function getActiveOrders(): Promise<ActiveOrder[]> {
  if (USE_MOCK) {
    await sleep(80);
    return validate(z.array(activeOrderSchema), fx.active, 'mock.active');
  }
  return api('/courier/orders/active/', z.array(activeOrderSchema));
}

export async function getCompletedOrders(): Promise<CompletedOrder[]> {
  if (USE_MOCK) {
    await sleep(80);
    return validate(z.array(completedOrderSchema), fx.completed, 'mock.completed');
  }
  return api('/courier/orders/completed/', z.array(completedOrderSchema));
}

export async function getStats(): Promise<Stats> {
  if (USE_MOCK) {
    await sleep(60);
    return fx.stats;
  }
  return api('/courier/stats/today/', statsSchema);
}

export type BalanceData = {
  balance: number;
  heldTotal: number;
  held: ActiveOrder[];
  ledger: LedgerEntry[];
};

export async function getBalance(): Promise<BalanceData> {
  if (USE_MOCK) {
    await sleep(60);
    return { balance: fx.balance, heldTotal: fx.heldTotal, held: fx.held, ledger: fx.ledger };
  }
  return api('/courier/balance/', balanceSchema);
}

export async function getNotifications(): Promise<CourierNotification[]> {
  if (USE_MOCK) {
    await sleep(60);
    return fx.notifications;
  }
  // API icon is a free string; narrow to IconName at the boundary.
  return (await api(
    '/courier/notifications/',
    z.array(notificationSchema),
  )) as CourierNotification[];
}

export async function getReconciliation(): Promise<Reconciliation> {
  if (USE_MOCK) {
    await sleep(60);
    return fx.recon;
  }
  return api('/courier/shift/reconciliation/', reconciliationApiSchema);
}

/* ---- order actions (courier lifecycle, spec §3) ---- */
const okSchema = z.object({ ok: z.boolean() }).partial();

/** Accept an assigned order within the hold-to-accept window. */
export async function acceptOrder(orderId: number): Promise<void> {
  if (USE_MOCK) {
    await sleep(120);
    return;
  }
  await api(`/orders/${orderId}/accept/`, okSchema, { method: 'POST' });
}

/** Decline an assigned order (frees it for reassignment). */
export async function declineOrder(orderId: number, reason?: string): Promise<void> {
  if (USE_MOCK) {
    await sleep(120);
    return;
  }
  await api(`/orders/${orderId}/decline/`, okSchema, {
    method: 'POST',
    body: JSON.stringify({ reason: reason ?? '' }),
  });
}

/** Advance a courier-settable step (PICKED_UP / ON_WAY / DELIVERED). Forward-only
 *  and owner-scoped on the server; returns the updated order. */
export async function updateOrderStatus(orderId: number, step: Step): Promise<ActiveOrder | null> {
  if (USE_MOCK) {
    await sleep(120);
    return null;
  }
  return api(`/orders/${orderId}/status/`, activeOrderSchema, {
    method: 'POST',
    body: JSON.stringify({ step }),
  });
}

/* ---- shift ---- */
export async function setOnline(online: boolean): Promise<void> {
  if (USE_MOCK) {
    await sleep(80);
    return;
  }
  await api('/courier/shift/online/', z.object({ online: z.boolean() }), {
    method: 'POST',
    body: JSON.stringify({ online }),
  });
}

export async function settleShift(): Promise<void> {
  if (USE_MOCK) {
    await sleep(120);
    return;
  }
  await api('/courier/shift/settle/', okSchema, { method: 'POST' });
}

/** Register the Expo push token for background "new order" / "ready" pushes. */
export async function registerPushToken(token: string, platform?: string): Promise<void> {
  if (USE_MOCK || !token) return;
  await api('/courier/push-token/', okSchema, {
    method: 'POST',
    body: JSON.stringify({ token, platform: platform ?? '' }),
  });
}

/* ---- payments ---- */
export async function createPayment(args: {
  order: ActiveOrder;
  provider: PaymentProvider;
  amount: number;
}): Promise<CreatePaymentResponse> {
  if (USE_MOCK) {
    await sleep(120);
    return {
      payment_id: args.order.id * 10,
      status: 'pending',
      link: payLink(args.order, args.provider),
    };
  }
  return api('/payments/create/', createPaymentResponseSchema, {
    method: 'POST',
    body: JSON.stringify({
      order_id: args.order.id,
      provider: args.provider,
      amount: args.amount,
    }),
  });
}

/** Refund a paid card/QR payment. Server emits `payment.refunded` (§8);
 *  in mock mode we emit it ourselves so OrderDetail reverts to unpaid. */
export async function refundPayment(args: { orderId: number; paymentId?: number }): Promise<void> {
  if (USE_MOCK) {
    await sleep(120);
    mockEmit({
      event: 'payment.refunded',
      data: { order_id: args.orderId, payment_id: args.paymentId },
    });
    return;
  }
  await api(
    `/payments/${args.paymentId ?? args.orderId}/refund/`,
    z.object({ status: z.string() }),
    {
      method: 'POST',
    },
  );
}

/* ---- schemas used only for real responses ---- */
const courierSchema = z.object({
  first: z.string(),
  last: z.string(),
  initials: z.string(),
  phone: z.string(),
  vehicle: z.string(),
  plate: z.string(),
  id: z.string(),
  branch: z.string(),
  rating: z.number(),
  online: z.boolean(),
});

const statsSchema = z.object({
  deliveries: z.number(),
  earnings: z.number(),
  cashCollected: z.number(),
  avgMinutes: z.number(),
  activeHours: z.string(),
  distanceKm: z.number(),
  byHour: z.array(z.object({ h: z.string(), n: z.number() })),
});

const ledgerSchema = z.object({
  at: z.string(),
  kind: z.enum(['hold', 'settle', 'cancel']),
  order: z.number(),
  amount: z.number(),
  label: z.string(),
});

const balanceSchema = z.object({
  balance: z.number(),
  heldTotal: z.number(),
  held: z.array(activeOrderSchema),
  ledger: z.array(ledgerSchema),
});

const notificationSchema = z.object({
  id: z.string(),
  icon: z.string(),
  tone: z.enum(['primary', 'success', 'warning', 'error', 'info']),
  title: z.string(),
  body: z.string(),
  at: z.string(),
  unread: z.boolean(),
  order: z.number(),
});
