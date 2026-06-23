/* ============================================================
   App state (Zustand). UI/session state only — server state
   lives in TanStack Query. Maps the prototype's App() state +
   the Tweaks (accent / dark / language / preview knobs).
   ============================================================ */
import { create } from 'zustand';
import type { AccentKey } from '@/theme/tokens';
import type { IncomingOrder } from '@/api/types';
import { active, incomingCandidate } from '@/data/fixtures';

export type ThemePref = 'system' | 'light' | 'dark';
export type Lang = 'EN' | 'RU' | 'UZ';

/** Design-tool preview knobs (from app.jsx Tweaks). Kept so every flow stays
 *  exercisable, but address rendering is genuinely data-driven per order. */
export type OrderStagePreview = 'Assigned' | 'Ready' | 'On the way' | 'Delivered';
export type AddressMode = 'Auto' | 'Text';
export type QrDemo = 'Auto-pay' | 'Waiting';

export type PushData = {
  icon: string;
  title: string;
  body: string;
  bg?: string;
};

type AppState = {
  // session
  loggedIn: boolean;
  online: boolean;
  shareLoc: boolean;
  // appearance
  themePref: ThemePref;
  accent: AccentKey;
  lang: Lang;
  // preview knobs
  orderStage: OrderStagePreview;
  addressMode: AddressMode;
  qrDemo: QrDemo;
  // transient push banner
  push: PushData | null;
  // new-order arrival (motion demo) + orders tab badge count
  incoming: IncomingOrder | null;
  orderCount: number;

  // actions
  setLoggedIn: (v: boolean) => void;
  setOnline: (v: boolean) => void;
  setShareLoc: (v: boolean) => void;
  setThemePref: (v: ThemePref) => void;
  setAccent: (v: AccentKey) => void;
  setLang: (v: Lang) => void;
  setOrderStage: (v: OrderStagePreview) => void;
  setAddressMode: (v: AddressMode) => void;
  setQrDemo: (v: QrDemo) => void;
  showPush: (p: PushData) => void;
  clearPush: () => void;
  simulateIncoming: () => void;
  receiveIncoming: (o: IncomingOrder) => void;
  acceptIncoming: () => void;
  rollbackAccept: () => void;
  dismissIncoming: () => void;
  logout: () => void;
};

export const useAppStore = create<AppState>((set) => ({
  loggedIn: false,
  online: true, // CDB.courier.online
  shareLoc: true,
  themePref: 'dark',
  accent: '#6E8BFF',
  lang: 'EN',
  orderStage: 'Assigned',
  addressMode: 'Auto',
  qrDemo: 'Auto-pay',
  push: null,
  incoming: null,
  orderCount: active.length,

  setLoggedIn: (v) => set({ loggedIn: v }),
  setOnline: (v) => set({ online: v }),
  setShareLoc: (v) => set({ shareLoc: v }),
  setThemePref: (v) => set({ themePref: v }),
  setAccent: (v) => set({ accent: v }),
  setLang: (v) => set({ lang: v }),
  setOrderStage: (v) => set({ orderStage: v }),
  setAddressMode: (v) => set({ addressMode: v }),
  setQrDemo: (v) => set({ qrDemo: v }),
  showPush: (p) => set({ push: p }),
  clearPush: () => set({ push: null }),
  simulateIncoming: () => set({ incoming: incomingCandidate }),
  receiveIncoming: (o) => set({ incoming: o }), // real server order.assigned
  acceptIncoming: () => set((s) => ({ incoming: null, orderCount: s.orderCount + 1 })),
  // server rejected the accept (window expired / reassigned) — undo the optimistic badge bump
  rollbackAccept: () => set((s) => ({ orderCount: Math.max(0, s.orderCount - 1) })),
  dismissIncoming: () => set({ incoming: null }),
  logout: () => set({ loggedIn: false, push: null, incoming: null }),
}));
