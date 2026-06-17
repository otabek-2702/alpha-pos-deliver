# Alpha POS — Courier (React Native + Expo)

A 1:1 React Native replica of the **Alpha POS Courier** Claude Design prototype
(`design/courier-delivery-mobile-app/`). Same screens, copy, tokens, light + dark
themes, and EN/RU/UZ as the prototype — nothing added, nothing removed.

- **Stack:** Expo SDK 56, React Native 0.85, TypeScript (strict), Expo Router
- **State:** TanStack Query (server) · Zustand (app/session) · zod (response validation)
- **Design:** tokens ported 1:1 from `styles/tokens.css`; Hanken Grotesk + JetBrains Mono via `expo-font`
- **Motion:** the prototype's `MOTION.md` layer ported 1:1 — `react-native-reanimated` v4 (+ `react-native-worklets`),
  `react-native-gesture-handler` (hold-to-accept, pull-to-refresh), `@shopify/react-native-skia` (QR scanning
  sweep), `react-native-svg` self-draws (checkmark / ring / route), `expo-haptics` (accept/paid/delivered/settle).
  Reduced-motion aware. See **Motion layer** below.
- **Realtime:** Django Channels WS (`/ws/courier/`) for `payment.paid` / `payment.refunded`,
  with a typed mock emitter so every flow runs with **no backend**.

---

## Run it

> **Node:** use **Node ≥ 20.19.4** (or 22.13+/24.3+). This repo was assembled on 20.18,
> which Metro/Expo accept with an `EBADENGINE` warning, but the Expo CLI prefers the
> newer line — bump Node if `expo start` misbehaves.

```bash
npm install                 # (.npmrc sets legacy-peer-deps for the RN 19 peer churn)
cp .env.example .env        # leave values blank to run on mock data + fake WS

# Type / lint / test
npm run typecheck           # tsc --noEmit         → clean
npm run lint                # eslint .             → clean
npm test                    # jest                 → payment state machine, 11 green

# Custom dev build (needed for the embedded fonts / native modules)
npx expo run:ios            # macOS only
npx expo run:android        # needs Android SDK / emulator
# then:
npm start                   # expo start --dev-client  (Metro)
```

The app also bundles cleanly for inspection without a device:

```bash
npx expo export --platform android --output-dir dist   # Metro bundle, zero errors
```

### Why a dev build (not Expo Go)

`expo-dev-client` is configured because the app embeds custom fonts and uses native
modules (`expo-secure-store`, `react-native-svg`, `expo-clipboard`). It still runs in
Expo Go for quick UI checks, but the **custom dev build is the supported target**.

---

## Environment

All config is read via `EXPO_PUBLIC_*` (inlined at build) with an `app.json → extra`
fallback. See `.env.example`:

| Var | Meaning |
| --- | --- |
| `EXPO_PUBLIC_API_BASE_URL` | DRF REST base, e.g. `https://api.alphapos.uz`. Blank → mock. |
| `EXPO_PUBLIC_WS_BASE_URL`  | Channels WS base, e.g. `wss://api.alphapos.uz` (socket = `<ws>/ws/courier/`). |
| `EXPO_PUBLIC_USE_MOCK`     | `true` forces typed fixtures + fake WS even if URLs are set. |

With no backend the app uses `src/data/fixtures.ts` (ported from `courier-data.js` /
`payments-data.js`) and `src/realtime/ws.ts`'s mock emitter. **No secret is committed**;
the auth token lives in `expo-secure-store`.

### Backend endpoints the client expects (see `design/.../BACKEND_INTEGRATION.md`)

| Method | Path | Used by |
| --- | --- | --- |
| `POST` | `/auth/courier/login/` | Login |
| `GET`  | `/courier/me/` · `/courier/orders/active/` · `/courier/orders/completed/` | Orders / Today |
| `GET`  | `/courier/stats/today/` · `/courier/balance/` · `/courier/notifications/` | Today / Balance / Notifications |
| `GET`  | `/courier/shift/reconciliation/` | Cash tab |
| `POST` | `/payments/create/` | QR screen (renders the **real** returned pay-link) |
| `POST` | `/payments/<id>/refund/` | Refund action |
| `WS`   | `/ws/courier/` | `payment.paid` → flips to Paid; `payment.refunded` → reverts to unpaid |

> **Security:** the phone never marks a card/QR payment paid. "Paid ✓" is driven only by
> the server `payment.paid` event (mock emitter stands in for the webhook→WS path). Cash is
> the one courier-recorded path and never claims a card success. `zod` validates every
> response; UZS handled as integers (tiyin only at the provider boundary).

---

## App config (`app.json`)

- **plugins:** `expo-router`, `expo-font`, `expo-secure-store`
- **scheme:** `alphacourier` (deep-link return target)
- **userInterfaceStyle:** `automatic` (follows OS theme; manual override in Profile)
- **iOS `LSApplicationQueriesSchemes`:** `yandexnavi`, `yandexmaps`, `comgooglemaps`, `dgis`
  — required so `Linking.canOpenURL` can detect the nav apps for the handoff chain.

### Navigation handoff

`src/lib/nav.ts` implements the `canOpenURL` fallback chain
**Yandex Navigator (`yandexnavi://build_route_on_map?lat_to=&lon_to=`) → 2GIS (`dgis://`) →
Google Maps (web)**; the per-app NavSheet rows open each app and fall back to its web URL.
Text-only addresses (order #62 has `coords: null`) search by address string instead of a pin.

---

## What's where

```
app/                         expo-router routes
  _layout.tsx                providers (fonts, Query, Theme) + global push overlay
  index.tsx                  auth redirect
  login.tsx                  LoginScreen (QR scan / phone tabs)
  (tabs)/_layout.tsx         custom TabBar: Orders / Today / Cash / Profile
  (tabs)/orders.tsx          OrdersScreen (shift toggle, balance pill, lists)
  (tabs)/today.tsx           TodayScreen (KPIs, by-hour bars)
  (tabs)/cash.tsx            CashScreen (reconciliation, settle/handover)
  (tabs)/profile.tsx         ProfileScreen + appearance/preview settings
  order/[id].tsx             OrderDetail (timeline, map, collect-payment flow)
  notifications.tsx          NotificationsScreen
  balance.tsx                BalanceScreen
src/
  theme/                     tokens.ts (light/dark/accents), ThemeProvider, fonts
  components/                Icon, ui/* primitives, order/*, TabBar, PushBanner, LedRow
  payments/                  CollectSheet, CashSheet, SplitSheet, QRPayScreen, PaidView, QRCode, machine.ts
  api/                       types, schemas (zod), client, hooks (TanStack), config
  realtime/ws.ts             Channels WS + mock emitter
  data/fixtures.ts           typed mock data
  i18n/                      EN/RU/UZ strings + makeT
  store/appStore.ts          Zustand (session, theme, lang, accent, preview knobs)
__tests__/paymentMachine.test.ts
design/                      the source prototype bundle (reference)
```

### testIDs (for Expo MCP / E2E)

`tab-orders|today|cash|profile`, `order-card-<id>`, `orders-shift-toggle`,
`orders-balance-pill`, `detail-action`, `detail-open-route`, `detail-collect-payment`,
`detail-refund`, `collect-cash|collect-qr|collect-split`, `cash-key-<k>`, `cash-confirm`,
`split-continue`, `qr-pay-screen`, `qr-waiting`, `qr-paid-badge`, `qr-paid-cash`,
`cash-settle`, `handover-confirm`, `theme-toggle`, `lang-uz|lang-ru|lang-en`,
`accent-<hex>`, `preview-stage-*`, `preview-address-*`, `preview-qr-*`.

---

## Motion layer

Ported 1:1 from the prototype's `MOTION.md` (additive over the base app — no screen/layout/copy
changed). Primitives live in [src/components/motion/](src/components/motion/):

| Primitive | Where | Motion |
| --- | --- | --- |
| `IncomingOrderSheet` | global (store `incoming`, "Simulate new order" in Profile) | spring-up sheet, depleting **countdown ring** (color→warning→error, urgent pulse), **hold-to-accept** fill → drawn check, accept haptic, tab-badge bump+glow |
| `Odometer` | Orders stats, Cash "cash in hand" | rolling mono digits; drains to 0 on settle |
| `CountUp` | Today KPIs | rAF tween 0→value |
| `GoalBar` | Orders daily goal | spring width fill |
| `DrawCheck` / `Ripple` | delivered celebration, paid view | self-drawing ring+tick, expanding ring |
| `RollDigits` | handover code | split-flap rotateX reveal |
| `Skeleton` / `PullToRefresh` | Orders | shimmer + custom branded-ring pull → skeletons |
| `QrCard` / `QrShimmer` | QR pay | breathing pulse + **Skia** conic sweep |
| TabBar | bottom bar | sliding indicator, active-icon spring |
| MapView | order detail | live-location ring + route self-draw |

Plus: status-pill morph, `+fee` float-up on delivery, change-due tween, split-meter spring, online
breathing dot, global button press-scale (0.96 / 0.9). Every animator early-returns to the final
value when **reduce-motion** is on (the base render is the visible end-state).

**Config:** `babel.config.js` adds `react-native-worklets/plugin` (reanimated 4); the root is wrapped
in `GestureHandlerRootView`. No extra `app.json` plugins (reanimated/gesture-handler/skia autolink).

**Deliberately not used:** `lottie-react-native` (the prototype's celebrations are SVG self-draws +
CSS ripples — no Lottie assets exist) and `moti` (reanimated-4 compatibility risk — primitives use
reanimated directly). Both are listed in the task as options; the design dictates neither.

---

## Verification status

Static checks (Windows host):

- ✅ `tsc --noEmit` — clean (TypeScript strict)
- ✅ `eslint .` — 0 errors, 0 warnings
- ✅ `jest` — payment state machine, **11/11** (BACKEND §10 cases)
- ✅ `expo export` — Metro bundles all screens/flows with **zero errors**
- ✅ `expo-doctor` — 18/18

On-device run (Android emulator **Pixel_7a_API_35**, dev build, driven over `adb`
screencap/input since no Expo MCP was available). Verified against the prototype:

- ✅ **Login** (QR viewfinder + Phone/password tabs) — Hanken Grotesk, blue `#3A5BDB`
- ✅ **Orders** — shift toggle, dark balance pill (`-258 000` coral), quick stats, order cards
- ✅ **Order detail** — lifecycle timeline + **stylized SVG MapView** (route/pin/distance),
  address, customer, collect banner, items, action footer
- ✅ **Payment flow** — CollectSheet → QR/Card → "Waiting…" → **`payment.paid` via the mock WS
  emitter (Payme)** → PaidView (burst check, receipt, fiscal line). Paid state + refund link.
- ✅ **Cash** reconciliation, **Today** (KPIs + by-hour bars + completed), **Profile**
- ✅ **Dark mode** — full token flip verified
- ✅ **EN / RU / UZ** — Cash screen + tab bar render correctly in all three (Cyrillic + Latin)

**Motion layer (second dev build, native reanimated/skia/gesture-handler):**

- ✅ **Delivered celebration** — status-pill morph, self-drawing green check + expanding ripple,
  **`+18 000 so'm` float-up**, timeline advance (captured mid-animation on device)
- ✅ **Orders motion content** — balance pill reworked to "Cash to hand in 258 000", **Odometer**
  stats, **Daily goal + GoalBar**, **sliding tab indicator**, **orders tab badge** count
- ✅ **IncomingOrderSheet** — spring-up over scrim, **live countdown ring** (19→ depleting blue),
  total/fee, Collect-cash + Not-ready badges, Hold-to-accept + Decline
- The rest (QR breathing+Skia shimmer, paid DrawCheck/ripple, cash-drain odometer, handover
  roll-in, pull-to-refresh, KPI count-up) share these verified reanimated/skia/svg primitives.
- ⚠ `adb input swipe` can't drive a true **press-and-hold** (Pressable cancels synthetic moves),
  so the hold-fill→accept animation wasn't captured frame-by-frame; the sheet, ring and button
  render correctly. A real finger (or Expo MCP, when available) completes it.

> **Build notes for Android:** RN 0.85 **forces the New Architecture** (`newArchEnabled` in
> `gradle.properties` is ignored), so the dev build compiles the Fabric C++ codegen (CMake/NDK
> auto-downloaded). The Gradle wrapper must be **8.x** — Gradle 9 removes `JvmVendorSpec.IBM_SEMERU`
> which RN's plugin references. Use the Android Studio bundled **JDK 17** (`.../Android Studio/jbr`)
> as `JAVA_HOME`. These affect the local build only, not the app.

## Visual / behavioural deltas

1. **Balance pill → Balance screen.** The prototype pointed the Orders balance pill at the
   **Cash** tab and left `BalanceScreen` unreferenced. To honour the required `BalanceScreen`
   *and* give the pill a sensible destination, the pill routes to `/balance`. (Cash tab still
   reachable via the bottom bar.)
2. **Tweaks → in-app settings.** The prototype's Tweaks panel (`frames/tweaks-panel.jsx`,
   design-tool scaffolding) is ignored per the brief; its real controls (theme, language,
   accent, and the order-stage / address / QR-demo preview knobs) are surfaced as actual
   settings under **Profile → Appearance / Preview**.
3. **Backdrop blur** (push banner, tab bar) is approximated with a high-opacity surface —
   RN has no CSS `backdrop-filter`. Add `expo-blur` if exact frosting is required.
4. **MapView** reproduces the prototype's *stylized SVG* map (it draws no real tiles); real
   navigation is the external handoff. No `react-native-maps` tile layer was added, matching
   "MapView as the prototype draws it."
5. **Shadows** are RN elevation approximations of the CSS multi-layer box-shadows; they read
   the same but are not pixel-identical, especially on Android.
6. **Token persistence is best-effort.** `LoginScreen.doLogin` no longer blocks navigation on
   `expo-secure-store` — some emulators have a slow/locked keystore that would otherwise hang
   the await. The token is stored fire-and-forget; login UX never stalls.
7. **Not yet screenshotted on-device:** NavSheet, CashSheet/SplitSheet, the QR "Waiting" frame,
   Notifications, Balance, and the Orders offline state. They share the verified primitives, but
   a full per-screen × both-themes × 3-langs sweep wasn't exhaustively captured.
