/* ============================================================
   Payment state machine — BACKEND_INTEGRATION.md §9.

     pending ──(webhook_paid)──▶ paid ──(refund)──▶ refunded
        │                          │
        └──(cancel/timeout)▶failed └──(partial_capture)▶ partial

   • `paid` is reached ONLY by a server-verified webhook event — never
     a client action. There is intentionally no client-confirm event.
   • `webhook_paid` is idempotent on `paid` (retried webhooks → one paid).
   • illegal jumps throw IllegalTransitionError.
   ============================================================ */

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'partial';

export type PaymentMachineEvent =
  | 'webhook_paid' // verified provider webhook (server-only)
  | 'cancel' // provider cancel
  | 'timeout' // expired without payment
  | 'refund' // refund a paid/partial payment
  | 'partial_capture'; // captured less than full amount

export class IllegalTransitionError extends Error {
  constructor(
    public from: PaymentStatus,
    public event: PaymentMachineEvent,
  ) {
    super(`Illegal payment transition: ${from} --${event}-->`);
    this.name = 'IllegalTransitionError';
  }
}

const TABLE: Record<PaymentStatus, Partial<Record<PaymentMachineEvent, PaymentStatus>>> = {
  pending: {
    webhook_paid: 'paid',
    cancel: 'failed',
    timeout: 'failed',
    partial_capture: 'partial',
  },
  paid: {
    webhook_paid: 'paid', // idempotent — webhooks retry
    refund: 'refunded',
    partial_capture: 'partial',
  },
  partial: {
    webhook_paid: 'paid',
    refund: 'refunded',
  },
  failed: {}, // terminal
  refunded: {}, // terminal
};

export function canTransition(from: PaymentStatus, event: PaymentMachineEvent): boolean {
  return TABLE[from][event] !== undefined;
}

export function transition(from: PaymentStatus, event: PaymentMachineEvent): PaymentStatus {
  const next = TABLE[from][event];
  if (next === undefined) throw new IllegalTransitionError(from, event);
  return next;
}

export function isTerminal(status: PaymentStatus): boolean {
  return status === 'failed' || status === 'refunded';
}

/* ---- order-level payment aggregation (BACKEND_INTEGRATION.md §2) ---- */
export type OrderPaymentState = 'paid' | 'partial' | 'unpaid';

export type PaymentRow = { amount: number; status: PaymentStatus };

/** Sum of amounts on rows that have reached `paid`. */
export function amountPaid(payments: PaymentRow[]): number {
  return payments.filter((p) => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
}

/** Derive an order's payment state from its payment rows + total. */
export function orderPaymentState(payments: PaymentRow[], total: number): OrderPaymentState {
  const paid = amountPaid(payments);
  if (paid >= total) return 'paid';
  if (paid > 0) return 'partial';
  return 'unpaid';
}

/** Convert integer UZS (so'm) → tiyin at the provider boundary only (§1). */
export function toTiyin(som: number): number {
  return som * 100;
}
