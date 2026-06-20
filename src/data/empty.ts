/* ============================================================
   Real-mode empty defaults. The screens fall back to the demo
   FIXTURES only in mock mode; in real mode a still-loading or
   FAILED query must NOT render fake "Jasur / 258 000 so'm" data as
   if it were live (UX audit: high). These zeroed shapes are what a
   real-mode screen shows until the backend responds — paired with a
   <FeedError> retry banner when the fetch actually errored.
   ============================================================ */
import type { BalanceData } from '@/api/client';
import type { Courier, Reconciliation, Stats } from '@/api/types';

export const emptyCourier: Courier = {
  first: '',
  last: '',
  initials: '',
  phone: '',
  vehicle: '',
  plate: '',
  id: '',
  branch: '',
  rating: 0,
  online: false,
};

export const emptyStats: Stats = {
  deliveries: 0,
  earnings: 0,
  cashCollected: 0,
  avgMinutes: 0,
  activeHours: '',
  distanceKm: 0,
  byHour: [],
};

export const emptyBalance: BalanceData = {
  balance: 0,
  heldTotal: 0,
  held: [],
  ledger: [],
};

export const emptyRecon: Reconciliation = {
  collectedCash: 0,
  qrCollected: 0,
  deliveryFees: 0,
  bonuses: 0,
  tips: 0,
  cashOrders: 0,
  qrOrders: 0,
  shiftStart: '',
  handoverCode: '',
  netEarnings: 0,
  cashInHand: 0,
  netPayout: 0,
};
