/* ============================================================
   Typed mock fixtures — ported from app/courier-data.js +
   app/payments-data.js. Used whenever the backend is unreachable
   (EXPO_PUBLIC_USE_MOCK or blank API URL) so every flow is
   exercisable without changing any UI.
   ============================================================ */
import type {
  ActiveOrder,
  CompletedOrder,
  Courier,
  CourierNotification,
  IncomingOrder,
  LedgerEntry,
  PaymentProviderChip,
  Reconciliation,
  Stats,
} from '@/api/types';

/** Candidate order for the "new order arrives" demo (app.jsx incomingCandidate). */
export const incomingCandidate: IncomingOrder = {
  id: 64,
  total: 96000,
  fee: 16000,
  payment: 'UNPAID',
  customer: { name: 'Aziza M.' },
  address: { text: 'Yunusobod 4-kvartal, 12-uy', distanceKm: 2.1 },
};

export const courier: Courier = {
  first: 'Jasur',
  last: 'Rakhimov',
  initials: 'JR',
  phone: '+998 90 123 45 67',
  vehicle: 'Scooter',
  plate: '01 A 777 BC',
  id: 'CR-118',
  branch: 'Alpha — Chilonzor',
  rating: 4.9,
  online: true,
};

export const active: ActiveOrder[] = [
  {
    id: 58,
    step: 'ASSIGNED',
    payment: 'UNPAID',
    total: 113000,
    fee: 15000,
    placedAt: '19:35',
    etaReady: '~6 min',
    customer: { name: 'Nigora A.', phone: '+998 93 412 88 01' },
    address: {
      text: "Bunyodkor ko'chasi 12, kv. 34, 2-qavat",
      landmark: 'near Chilonzor metro',
      coords: { lat: 41.2853, lng: 69.2034 },
      distanceKm: 2.4,
    },
    lines: [
      { name: 'Pitsa tovuqli katta', qty: 1, price: 85000 },
      { name: 'Toster', qty: 1, price: 28000 },
    ],
  },
  {
    id: 56,
    step: 'READY',
    payment: 'PAID',
    total: 76000,
    fee: 12000,
    placedAt: '19:31',
    etaReady: 'Ready now',
    customer: { name: 'Sardor T.', phone: '+998 90 700 14 22' },
    address: {
      text: 'Mukimiy 45, ofis 3',
      landmark: 'Biznes-tsentr, 1-podyezd',
      coords: { lat: 41.2789, lng: 69.2102 },
      distanceKm: 1.6,
    },
    lines: [
      { name: 'Non kabob big', qty: 1, price: 56000 },
      { name: 'Lester', qty: 1, price: 20000 },
    ],
  },
  {
    id: 62,
    step: 'ON_WAY',
    payment: 'UNPAID',
    total: 145000,
    fee: 18000,
    placedAt: '19:18',
    etaReady: 'Ready',
    customer: { name: 'Dilshod K.', phone: '+998 97 333 50 19' },
    address: {
      text: "Qatortol 88, xususiy uy, ko'k darvoza",
      landmark: 'after the school, blue gate',
      coords: null, // text-only address
      distanceKm: 3.1,
    },
    lines: [
      { name: 'Lavash katta', qty: 2, price: 72000 },
      { name: 'Lester', qty: 1, price: 1000 },
    ],
  },
];

export const completed: CompletedOrder[] = [
  {
    id: 51,
    total: 145000,
    fee: 18000,
    payment: 'PAID',
    deliveredAt: '16:48',
    minutes: 19,
    customer: { name: 'Madina R.' },
    area: 'Novza',
  },
  {
    id: 48,
    total: 38000,
    fee: 10000,
    payment: 'PAID',
    deliveredAt: '15:58',
    minutes: 24,
    customer: { name: 'Otabek S.' },
    area: 'Chilonzor 9',
  },
  {
    id: 44,
    total: 92000,
    fee: 14000,
    payment: 'PAID',
    deliveredAt: '14:40',
    minutes: 21,
    customer: { name: 'Kamola N.' },
    area: "Mirzo Ulug'bek",
  },
  {
    id: 41,
    total: 210000,
    fee: 22000,
    payment: 'PAID',
    deliveredAt: '13:15',
    minutes: 26,
    customer: { name: 'Jahongir A.' },
    area: 'Sergeli',
  },
];

export const stats: Stats = {
  deliveries: 4,
  earnings: 64000,
  cashCollected: 383000,
  avgMinutes: 22,
  activeHours: '5h 12m',
  distanceKm: 31,
  byHour: [
    { h: '10', n: 0 },
    { h: '11', n: 1 },
    { h: '12', n: 0 },
    { h: '13', n: 1 },
    { h: '14', n: 1 },
    { h: '15', n: 0 },
    { h: '16', n: 1 },
    { h: '17', n: 0 },
    { h: '18', n: 0 },
    { h: '19', n: 0 },
  ],
};

// balance goes negative while holding UNPAID assigned orders
export const held: ActiveOrder[] = active.filter((o) => o.payment === 'UNPAID');
export const heldTotal: number = held.reduce((s, o) => s + o.total, 0);
export const balance: number = -heldTotal; // e.g. -(113000 + 145000) = -258000

export const ledger: LedgerEntry[] = [
  { at: '19:35', kind: 'hold', order: 62, amount: -145000, label: 'Order #62 assigned — unpaid' },
  { at: '19:34', kind: 'hold', order: 58, amount: -113000, label: 'Order #58 assigned — unpaid' },
  { at: '18:10', kind: 'settle', order: 44, amount: +92000, label: 'Order #44 paid · cashier' },
  {
    at: '17:02',
    kind: 'cancel',
    order: 40,
    amount: +56000,
    label: 'Order #40 cancelled · cashier',
  },
  { at: '16:30', kind: 'settle', order: 41, amount: +210000, label: 'Order #41 paid · cashier' },
];

export const notifications: CourierNotification[] = [
  {
    id: 'n1',
    icon: 'scooter',
    tone: 'primary',
    title: 'New order #58 assigned',
    body: 'Kitchen is preparing — get ready to pick up.',
    at: '19:35',
    unread: true,
    order: 58,
  },
  {
    id: 'n2',
    icon: 'checkcircle',
    tone: 'success',
    title: 'Order #56 is ready',
    body: 'Ready for pickup at the counter.',
    at: '19:32',
    unread: true,
    order: 56,
  },
  {
    id: 'n3',
    icon: 'banknote',
    tone: 'warning',
    title: 'Order #62 — collect cash',
    body: "Unpaid · collect 145 000 so'm on delivery.",
    at: '19:18',
    unread: false,
    order: 62,
  },
  {
    id: 'n4',
    icon: 'wallet',
    tone: 'success',
    title: 'Order #44 marked paid',
    body: '+92 000 cleared from your balance.',
    at: '18:10',
    unread: false,
    order: 44,
  },
  {
    id: 'n5',
    icon: 'close',
    tone: 'error',
    title: 'Order #40 cancelled',
    body: 'Cancelled by cashier · +56 000 restored.',
    at: '17:02',
    unread: false,
    order: 40,
  },
];

/** PayTechUZ unified set — the chips drawn on the QR pay screen. */
export const providers: PaymentProviderChip[] = [
  { key: 'payme', name: 'Payme', bg: '#33C5BE', fg: '#fff', mark: 'P' },
  { key: 'click', name: 'Click', bg: '#00A6E9', fg: '#fff', mark: 'C' },
  { key: 'uzum', name: 'Uzum', bg: '#7000FF', fg: '#fff', mark: 'U' },
  { key: 'paynet', name: 'Paynet', bg: '#0A8F3C', fg: '#fff', mark: 'P' },
];

const reconBase = {
  collectedCash: 383000,
  qrCollected: 221000,
  deliveryFees: 64000,
  bonuses: 15000,
  tips: 8000,
  cashOrders: 3,
  qrOrders: 2,
  shiftStart: '14:05',
  handoverCode: 'ALP-4471',
};

export const recon: Reconciliation = {
  ...reconBase,
  netEarnings: reconBase.deliveryFees + reconBase.bonuses + reconBase.tips,
  cashInHand: reconBase.collectedCash,
  netPayout: reconBase.deliveryFees + reconBase.bonuses + reconBase.tips,
};
