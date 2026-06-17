# Backend integration report — alpha_pos_server ↔ courier app

Installed the backend (`github.com/MythicalCosmic/alpha_pos_server`), ran it, and
connected the mobile app to it. The backend was built to `BACKEND_SPEC.md` almost
exactly — the courier app, URLs, WS consumers, and lifecycle all match. Below: how
it was run, what was verified, the bugs found + fixed, and what's still stubbed.

## How it was run (no Docker on this host)

The repo ships a Docker compose (Postgres + Redis + uvicorn). Docker isn't installed
here, so it was run natively on the shared spine's defaults:

- `git submodule update --init` to fetch `alpha_pos_core` (the shared Django spine).
- `py -3.12 -m venv .venv && pip install ./alpha_pos_core -r requirements.txt`.
- `config/settings_dev.py` (added) — a dev shim: `from config.settings import *` then
  an **in-memory channel layer** (WS without Redis) + `OPEN_LAN=True`. Default DB is
  **sqlite**, so no Postgres needed.
- Env: `DEBUG=True LICENSE_DEV_BYPASS=1 SECRET_KEY=dev DJANGO_SETTINGS_MODULE=config.settings_dev`
  (the license kill-switch middleware 503s every business endpoint without the dev bypass).
- `manage.py migrate` → `manage.py seed_courier` (demo courier `+998901234567 / courier123`).
- `uvicorn config.asgi:application --host 0.0.0.0 --port 8009` (8000 is already taken by
  the **local/desktop** POS edition — a different app).

## What was verified against the live server

- **Every REST feed** (`contract_check.py`) — `/auth/courier/login/`, `/courier/me`,
  `orders/active`, `orders/completed`, `stats/today`, `balance`, `notifications`,
  `shift/reconciliation`, and the order actions — all 200, all shapes match the app's
  zod schemas. Forward-only + owner-scope enforced (illegal transitions → 409).
- **Lifecycle logic** — the backend's own pytest suite: `couriers/tests/` **5/5 pass**
  (forward-only, courier-can't-set-READY, delivered-closes-order, accept-window expiry,
  mark_ready idempotent).
- **Realtime end-to-end** (`ws_check.py`, in-process InMemory layer): courier socket
  authed and received `order.status`; cashier socket received `order.status` **and
  `courier.location`** (the courier→cashier GPS relay). Confirmed the whole funnel works.

## Bugs found + fixed in the backend

Both confirmed live (text-only address order + a held cash order), then fixed. **These
edits are in the local clone `backend-server/` only — push them to the GitHub repo.**

1. **`address.distanceKm: null` blanked the orders screen.** `_address()` always emitted
   `distanceKm`, sending `null` for text-only addresses. The app schema is
   `z.number().optional()`, which rejects `null` → zod throws → whole feed blanks.
   Fix (`couriers/presenters.py`): **omit** the key when unknown.
2. **`balance.held` wrong shape crashed the Cash screen.** It returned `{order, amount}`
   pairs, but the app's `balanceSchema` declares `held: array(activeOrderSchema)` and the
   Cash screen reads `o.id / o.customer.name / o.placedAt / o.total`. Fix (`couriers/views.py`):
   return full `active_order_dict(...)` per held order.

## What was wired on the app side

The app was mock-first and only opened a socket during QR payment — it **ignored** the
backend's delivery events. Added:

- **Persistent courier socket** (`src/realtime/ws.ts` `subscribeCourierEvents` +
  `src/realtime/useCourierRealtime.ts`, mounted in `app/_layout.tsx`): maps
  `order.assigned` → IncomingOrderSheet, `order.ready` → "Order ready" push + refetch,
  `order.status`/`order.cancelled` → refetch. Auto-reconnects. No-op in mock mode.
- **Order actions → backend** (`src/api/client.ts`): `acceptOrder`, `declineOrder`,
  `updateOrderStatus`, plus `setOnline` / `settleShift` / `registerPushToken`. Wired
  into the incoming sheet (accept/decline) and the order-detail step button (`advance()`).
- **Schema robustness**: `distanceKm` is now `z.number().nullable().optional()` (defense
  in depth) and the order-detail subtitle no longer renders "undefined km away".
- **Config** (`.env`): `EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:8009`,
  `EXPO_PUBLIC_WS_BASE_URL=ws://10.0.2.2:8009`, `EXPO_PUBLIC_USE_MOCK=false`
  (10.0.2.2 = host machine from the Android emulator). Blank URLs / `USE_MOCK=true`
  reverts to the offline demo.

App static checks all green: **tsc 0 · eslint 0 · jest 11/11**.

## Still stubbed / follow-ups (not bugs)

- **Payments not implemented in this backend.** The app calls `/payments/create/` and
  `/payments/<id>/refund/` and waits for a `payment.paid` WS event. This courier backend
  doesn't mount those (deferred to the payments doc, `BACKEND_INTEGRATION.md §5`), and
  nothing emits `payment.paid` yet. The QR-pay-via-WS flow won't complete until that's
  built. The security model is correct (paid only via verified webhook → WS).
- **App GPS streaming** needs `expo-location` (not installed). The backend side is done
  and verified (WS `location.ping` + REST `/courier/location/` → cashier `courier.location`);
  the app just needs to feed real coordinates.
- **`balance` / `reconciliation` money fields** (payout, qr_collected, ledger, tips,
  bonuses) are `0`/empty stubs in the backend pending the payments ledger.

## On-device verification (pending)

Pure JS/TS changes — no native rebuild needed; a Metro restart picks up `.env`. To verify
on the emulator: start it, `npx expo start --dev-client`, open the installed dev build.
Backend is running at `0.0.0.0:8009`.
