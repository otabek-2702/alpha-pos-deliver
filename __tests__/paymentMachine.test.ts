/* ============================================================
   Payment state-machine tests — mirrors BACKEND_INTEGRATION.md §10.
   ============================================================ */
/// <reference types="jest" />
import {
  IllegalTransitionError,
  amountPaid,
  canTransition,
  isTerminal,
  orderPaymentState,
  toTiyin,
  transition,
  type PaymentRow,
} from '@/payments/machine';

describe('payment state machine', () => {
  it('pending → paid only via a (verified) webhook event', () => {
    expect(transition('pending', 'webhook_paid')).toBe('paid');
  });

  it('there is no client-confirm path to paid — illegal events throw', () => {
    // The app can only request a charge; it can never mark paid itself.
    expect(() => transition('pending', 'refund')).toThrow(IllegalTransitionError);
  });

  it('webhook idempotency: a retried paid webhook keeps it paid (one paid)', () => {
    expect(transition('paid', 'webhook_paid')).toBe('paid');
  });

  it('cancel / timeout move pending → failed', () => {
    expect(transition('pending', 'cancel')).toBe('failed');
    expect(transition('pending', 'timeout')).toBe('failed');
  });

  it('refund: paid → refunded; pending → refund is rejected', () => {
    expect(transition('paid', 'refund')).toBe('refunded');
    expect(() => transition('pending', 'refund')).toThrow(IllegalTransitionError);
  });

  it('failed and refunded are terminal', () => {
    expect(isTerminal('failed')).toBe(true);
    expect(isTerminal('refunded')).toBe(true);
    expect(() => transition('refunded', 'webhook_paid')).toThrow();
    expect(() => transition('failed', 'webhook_paid')).toThrow();
  });

  it('canTransition reports legal/illegal edges', () => {
    expect(canTransition('pending', 'webhook_paid')).toBe(true);
    expect(canTransition('paid', 'cancel')).toBe(false);
  });
});

describe('order-level payment aggregation (split payments)', () => {
  it('split cash 57 000 + payme 56 000 on a 113 000 order ⇒ paid', () => {
    const rows: PaymentRow[] = [
      { amount: 57000, status: 'paid' },
      { amount: 56000, status: 'paid' },
    ];
    expect(amountPaid(rows)).toBe(113000);
    expect(orderPaymentState(rows, 113000)).toBe('paid');
  });

  it('only one part paid ⇒ partial', () => {
    const rows: PaymentRow[] = [
      { amount: 57000, status: 'paid' },
      { amount: 56000, status: 'pending' },
    ];
    expect(orderPaymentState(rows, 113000)).toBe('partial');
  });

  it('nothing paid ⇒ unpaid', () => {
    const rows: PaymentRow[] = [{ amount: 113000, status: 'pending' }];
    expect(orderPaymentState(rows, 113000)).toBe('unpaid');
  });
});

describe('tiyin boundary', () => {
  it('113 000 so’m ⇒ gateway receives 11 300 000 tiyin', () => {
    expect(toTiyin(113000)).toBe(11300000);
  });
});
