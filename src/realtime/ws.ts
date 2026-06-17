/* ============================================================
   Realtime payment events — Django Channels WS (/ws/courier/).
   Principle (BACKEND_INTEGRATION.md §1): the phone NEVER decides a
   payment is paid. "Paid ✓" is driven exclusively by a server
   `payment.paid` event emitted AFTER a verified provider webhook.
   In mock mode a fake emitter stands in for that webhook→WS path so
   the QR flow is exercisable without a backend.
   ============================================================ */
import { COURIER_WS_PATH, USE_MOCK, WS_BASE_URL } from '@/api/config';
import { courierFrameSchema, paymentEventSchema, validate } from '@/api/schemas';
import type { CourierFrame } from '@/api/schemas';
import type { PaymentEvent, PaymentProvider } from '@/api/types';
import { getToken } from '@/lib/secureToken';

export type PaymentEventHandler = (e: PaymentEvent) => void;
export type PaymentChannel = { close: () => void };

export type SubscribeOptions = {
  /** Mock-only: auto-fire a `payment.paid` after a short delay (the QR demo's
   *  "Auto-pay" mode). False = "Waiting" mode, holds until a manual emit. */
  autoPay?: boolean;
  amount?: number;
};

/* ---- Mock event bus: fixtures, refunds + the demo emit through here ---- */
const busHandlers = new Set<PaymentEventHandler>();

/** Emit a fake server event (mock mode only). */
export function mockEmit(e: PaymentEvent): void {
  busHandlers.forEach((h) => h(e));
}

const MOCK_PROVIDERS: { provider: PaymentProvider; name: string }[] = [
  { provider: 'payme', name: 'Payme' },
  { provider: 'click', name: 'Click' },
  { provider: 'uzum', name: 'Uzum' },
  { provider: 'paynet', name: 'Paynet' },
];

/**
 * Subscribe to payment events for one order. Returns a channel you must close on
 * unmount. Replaces the prototype's simulated setTimeout in QRPayScreen.
 */
export function subscribePaymentEvents(
  orderId: number,
  handler: PaymentEventHandler,
  opts: SubscribeOptions = {},
): PaymentChannel {
  if (USE_MOCK) {
    const onBus: PaymentEventHandler = (e) => {
      if (e.data.order_id === orderId) handler(e);
    };
    busHandlers.add(onBus);

    let timer: ReturnType<typeof setTimeout> | undefined;
    if (opts.autoPay) {
      const p = MOCK_PROVIDERS[Math.floor(Math.random() * MOCK_PROVIDERS.length)]!;
      timer = setTimeout(() => {
        mockEmit({
          event: 'payment.paid',
          data: { order_id: orderId, provider: p.provider, method: p.name, amount: opts.amount },
        });
      }, 4600);
    }
    return {
      close: () => {
        busHandlers.delete(onBus);
        if (timer) clearTimeout(timer);
      },
    };
  }

  // Real Channels socket. Server verifies the webhook signature, then pushes.
  const base = WS_BASE_URL.replace(/\/+$/, '');
  let socket: WebSocket | null = null;
  let closed = false;

  void (async () => {
    const token = await getToken();
    if (closed) return;
    const url = base + COURIER_WS_PATH + (token ? `?token=${encodeURIComponent(token)}` : '');
    socket = new WebSocket(url);
    socket.onmessage = (ev: WebSocketMessageEvent) => {
      try {
        const parsed = validate(paymentEventSchema, JSON.parse(String(ev.data)), 'ws');
        if (parsed.data.order_id === orderId) handler(parsed);
      } catch {
        // ignore malformed frames
      }
    };
  })();

  return {
    close: () => {
      closed = true;
      socket?.close();
    },
  };
}

export type CourierFrameHandler = (f: CourierFrame) => void;

/**
 * Persistent courier socket (real mode only). Carries the delivery lifecycle
 * frames the server pushes to `courier_<id>`: order.assigned (a new order →
 * IncomingOrderSheet), order.ready (kitchen done → "ready" push + refetch),
 * order.status / order.cancelled (refetch). Auto-reconnects. In mock mode this
 * is a no-op — the demo drives the incoming sheet via the store's
 * `simulateIncoming` button instead.
 */
export function subscribeCourierEvents(handler: CourierFrameHandler): PaymentChannel {
  if (USE_MOCK) return { close: () => {} };

  const base = WS_BASE_URL.replace(/\/+$/, '');
  let socket: WebSocket | null = null;
  let closed = false;
  let retry: ReturnType<typeof setTimeout> | undefined;

  const open = async () => {
    const token = await getToken();
    if (closed) return;
    const url = base + COURIER_WS_PATH + (token ? `?token=${encodeURIComponent(token)}` : '');
    socket = new WebSocket(url);
    socket.onmessage = (ev: WebSocketMessageEvent) => {
      try {
        handler(validate(courierFrameSchema, JSON.parse(String(ev.data)), 'ws.courier'));
      } catch {
        // ignore malformed / unrelated frames (payment.*, connected hello)
      }
    };
    socket.onclose = () => {
      socket = null;
      if (!closed) retry = setTimeout(() => void open(), 3000); // reconnect
    };
  };
  void open();

  return {
    close: () => {
      closed = true;
      if (retry) clearTimeout(retry);
      socket?.close();
    },
  };
}
