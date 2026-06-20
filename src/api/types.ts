/* ============================================================
   Domain types — mirror the prototype's data model (courier-data.js,
   payments-data.js) and the BACKEND_INTEGRATION.md contract.
   ============================================================ */
import type { IconName } from '@/components/Icon';

/** Courier-facing lifecycle (courier-data.js STEPS). */
export type Step = 'ASSIGNED' | 'READY' | 'PICKED_UP' | 'ON_WAY' | 'DELIVERED';
export const STEPS: Step[] = ['ASSIGNED', 'READY', 'PICKED_UP', 'ON_WAY', 'DELIVERED'];
export const STEP_LABEL: Record<Step, string> = {
  ASSIGNED: 'Assigned',
  READY: 'Ready for pickup',
  PICKED_UP: 'Picked up',
  ON_WAY: 'On the way',
  DELIVERED: 'Delivered',
};

/** Order payment flag carried by the courier (PAID/UNPAID). */
export type OrderPayment = 'PAID' | 'UNPAID';

export type Coords = { lat: number; lng: number };

export type Address = {
  text: string;
  landmark?: string;
  coords: Coords | null;
  distanceKm?: number | null;
};

export type Customer = { name: string; phone?: string };

export type OrderLine = { name: string; qty: number; price: number };

export type ActiveOrder = {
  id: number;
  step: Step;
  payment: OrderPayment;
  total: number;
  fee: number;
  placedAt: string;
  etaReady: string;
  customer: Required<Pick<Customer, 'name'>> & { phone: string };
  address: Address;
  lines: OrderLine[];
};

export type CompletedOrder = {
  id: number;
  total: number;
  fee: number;
  payment: OrderPayment;
  deliveredAt: string;
  minutes: number;
  customer: { name: string };
  area: string;
};

/** Lightweight incoming-order payload for the new-order arrival sheet. */
export type IncomingOrder = {
  id: number;
  total: number;
  fee: number;
  payment: OrderPayment;
  customer: { name: string };
  address: { text: string; distanceKm: number };
  /** Server hold-to-accept window (seconds) from order.assigned `expires_in`. */
  expiresIn?: number;
};

export type Courier = {
  first: string;
  last: string;
  initials: string;
  phone: string;
  vehicle: string;
  plate: string;
  id: string;
  branch: string;
  rating: number;
  online: boolean;
};

export type HourBucket = { h: string; n: number };

export type Stats = {
  deliveries: number;
  earnings: number;
  cashCollected: number;
  avgMinutes: number;
  activeHours: string;
  distanceKm: number;
  byHour: HourBucket[];
};

export type LedgerKind = 'hold' | 'settle' | 'cancel';
export type LedgerEntry = {
  at: string;
  kind: LedgerKind;
  order: number;
  amount: number;
  label: string;
};

export type CourierNotification = {
  id: string;
  icon: IconName;
  tone: 'primary' | 'success' | 'warning' | 'error' | 'info';
  title: string;
  body: string;
  at: string;
  unread: boolean;
  order: number;
};

/** PayTechUZ-backed providers (payments-data.js PAY.PROVIDERS). */
export type PaymentProviderChip = {
  key: string;
  name: string;
  bg: string;
  fg: string;
  mark: string;
};

/** Shift reconciliation (payments-data.js recon + ShiftReconciliationView). */
export type Reconciliation = {
  collectedCash: number;
  qrCollected: number;
  deliveryFees: number;
  bonuses: number;
  tips: number;
  cashOrders: number;
  qrOrders: number;
  shiftStart: string;
  handoverCode: string;
  netEarnings: number;
  cashInHand: number;
  netPayout: number;
};

/* ---- Backend payment enums (BACKEND_INTEGRATION.md §2) ---- */
export type PaymentProvider = 'cash' | 'payme' | 'click' | 'uzum' | 'paynet' | 'unified_qr';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'partial';

/** Realtime events the server emits (BACKEND_INTEGRATION.md §4, §8). */
export type PaymentEventType = 'payment.paid' | 'payment.refunded';
export type PaymentEvent = {
  event: PaymentEventType;
  data: {
    order_id: number;
    payment_id?: number;
    // Backend courier-payment vocabulary is CASH/CARD/QR; mock emits gateway
    // names. Kept as a free string so an unknown provider never drops the frame.
    provider?: string;
    method?: string;
    amount?: number;
    status?: string;
    is_paid?: boolean;
  };
};
