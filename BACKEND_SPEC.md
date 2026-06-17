# Alpha POS — Courier App · BACKEND SPEC (orders, assignment, realtime, location)

> **Who this is for.** The backend engineer building the server the **courier mobile app**
> (this repo, React Native + Expo) talks to. It is a **build-against blueprint** — concrete
> models, endpoints, and WebSocket contracts — not a tested codebase. The Python is reference
> sketches; adapt to your repo, write migrations, run the suite yourself.
>
> **Companion doc:** [`design/.../BACKEND_INTEGRATION.md`](design/courier-delivery-mobile-app/project/BACKEND_INTEGRATION.md)
> covers **payments/refunds/fiscalization/unified-QR** in full. THIS doc covers **order delivery
> assignment, the "not ready → ready" notifications, the order lifecycle, and streaming the
> courier's location to the cashier desktop**. Read both; they share the same Channels layer.

**Stack (unchanged):** Django + DRF, PostgreSQL, Redis, **Django Channels (WebSockets)**, Daphne/
Uvicorn ASGI. Region UZ, currency **UZS as integer so'm** (never floats). Desktop POS = the existing
Quasar/Vue app; courier = this RN app.

---

## 0. The contract is the app's parser — match these field names exactly

The mobile app validates every response with zod. **Field names below are load-bearing** — an
unexpected name = the screen shows nothing. Two conventions, both already coded in the app:

- **Read feeds (orders, courier, stats, balance, notifications): camelCase** — `placedAt`,
  `etaReady`, `distanceKm`, `deliveredAt`. (Configure DRF to camelCase these serializers, e.g.
  `djangorestframework-camel-case`, OR name the serializer fields directly.)
- **Reconciliation response + ALL WebSocket event `data`: snake_case** — `order_id`, `cash_in_hand`,
  `handover_code`. (The app transforms these.)

Money is integer so'm. Times the app renders verbatim are short strings (`"19:35"`, `"~6 min"`),
not ISO — send display strings for `placedAt`/`etaReady`/`deliveredAt`/`at`/`shiftStart`. Send ISO
elsewhere if you add fields.

---

## 1. Order lifecycle & the delivery handoff (the core of this doc)

```
DESKTOP POS                         SERVER                                   COURIER APP
-----------                         ------                                   -----------
create order, type=DELIVERY  ─────► Order(status=PREPARING, delivery)
cashier picks "deliver later"
assign to courier  ──────────────► Assignment(courier, order)  ──ws──►  order.assigned
                                    (+ push: "New order, kitchen preparing")   → IncomingOrderSheet
                                                                                 (hold-to-accept)
                                    courier accepts (REST) ◄──────────  POST /orders/<id>/accept/
kitchen marks READY  ────────────► Order.status = READY        ──ws──►  order.ready
                                    (+ push: "Order #X is ready")             → notification + pill
                                                                          POST /orders/<id>/status/ (PICKED_UP)
                                    Order.status = PICKED_UP    ──ws──►  order.status  (→ desktop too)
courier shares GPS while on route ◄──── ws location.ping ───────────  (auto while PICKED_UP/ON_WAY)
desktop shows courier moving   ◄──ws── courier.location
                                    Order.status = ON_WAY / DELIVERED ─ws─► order.status
```

### Courier-facing lifecycle (the app's `step` enum — send these exact strings)
`ASSIGNED → READY → PICKED_UP → ON_WAY → DELIVERED`

- **ASSIGNED** — assigned but kitchen still preparing (app shows badge **"Preparing"**, action button
  disabled "Waiting for kitchen").
- **READY** — kitchen done, ready for pickup.
- **PICKED_UP / ON_WAY** — courier has it / en route. **Location sharing is ON during these two.**
- **DELIVERED** — terminal for the courier.

> Keep your **kitchen/order status** (PREPARING/READY/...) where it already lives. The courier `step`
> is a *projection*: `PREPARING→ASSIGNED`, `READY→READY`, then courier-driven `PICKED_UP/ON_WAY/DELIVERED`.
> Don't rewrite existing order-status logic — add the courier projection + assignment alongside it.

---

## 2. Data model (additions; reference sketch)

```python
# couriers/models.py
class Courier(models.Model):
    user      = models.OneToOneField("auth.User", on_delete=models.CASCADE)
    first, last = models.CharField(...), models.CharField(...)
    phone     = models.CharField(max_length=24)
    vehicle   = models.CharField(max_length=32)     # "Scooter"
    plate     = models.CharField(max_length=24)     # "01 A 777 BC"
    code      = models.CharField(max_length=16)     # "CR-118"  (the app's courier.id)
    branch    = models.ForeignKey("branches.Branch", on_delete=models.PROTECT)
    rating    = models.DecimalField(max_digits=2, decimal_places=1, default=5.0)
    online    = models.BooleanField(default=False)   # on-shift toggle
    share_loc = models.BooleanField(default=True)

class DeliveryAssignment(models.Model):
    order     = models.OneToOneField("orders.Order", on_delete=models.CASCADE, related_name="delivery")
    courier   = models.ForeignKey(Courier, null=True, on_delete=models.SET_NULL)
    step      = models.CharField(max_length=12, default="ASSIGNED")   # courier projection
    fee       = models.BigIntegerField(default=0)        # courier's delivery fee (so'm)
    assigned_at, accepted_at, ready_at, picked_at, delivered_at = (models.DateTimeField(null=True),)*5
    # address (text-only OR with coords — the app renders a map only when coords present)
    addr_text     = models.CharField(max_length=255)
    addr_landmark = models.CharField(max_length=255, blank=True, default="")
    addr_lat      = models.FloatField(null=True, blank=True)   # null => text-only address, no map pin
    addr_lng      = models.FloatField(null=True, blank=True)
    distance_km   = models.FloatField(null=True, blank=True)

class LocationPing(models.Model):       # latest courier position (keep last N or just upsert latest)
    courier   = models.ForeignKey(Courier, on_delete=models.CASCADE)
    lat, lng  = models.FloatField(), models.FloatField()
    at        = models.DateTimeField(auto_now=True)

class PushToken(models.Model):          # for §6 push notifications
    courier   = models.ForeignKey(Courier, on_delete=models.CASCADE)
    token     = models.CharField(max_length=255, unique=True)   # Expo push token / FCM
    platform  = models.CharField(max_length=8)
```

`Payment` model + state machine → see the payments doc (don't duplicate).

---

## 3. REST API (exact paths the app already calls)

Auth: `Authorization: Token <token>` (DRF TokenAuth or JWT — the app stores it in secure-store and
sends it as `Token <token>`; if you use JWT, accept it under the same header or tell the mobile dev).

| Method | Path | Body → Response | Drives |
| --- | --- | --- | --- |
| `POST` | `/auth/courier/login/` | `{phone,password}` **or** `{qr}` → `{ "token": "..." }` | Login |
| `GET`  | `/courier/me/` | → **Courier** (below) | header, profile |
| `GET`  | `/courier/orders/active/` | → **ActiveOrder[]** | Orders "Active" |
| `GET`  | `/courier/orders/completed/` | → **CompletedOrder[]** | Orders "Completed", Today |
| `GET`  | `/courier/stats/today/` | → **Stats** | Today, Orders quick-stats |
| `GET`  | `/courier/balance/` | → `{balance, heldTotal, held[], ledger[]}` | Balance / Cash held |
| `GET`  | `/courier/notifications/` | → **Notification[]** | Notifications |
| `GET`  | `/courier/shift/reconciliation/` | → **Reconciliation** (snake_case) | Cash tab |
| `POST` | `/orders/<id>/accept/` | → `{ "ok": true }` (and emits `order.status`) | IncomingOrderSheet "Hold to accept" |
| `POST` | `/orders/<id>/decline/` | → `{ "ok": true }` | IncomingOrderSheet "Decline" |
| `POST` | `/orders/<id>/status/` | `{ "step": "PICKED_UP" }` → updated order | Detail action button (PICKED_UP/ON_WAY/DELIVERED) |
| `POST` | `/courier/location/` | `{ "lat":.., "lng":.. }` → `{ "ok": true }` | fallback if WS down (see §5) |
| `POST` | `/courier/shift/online/` | `{ "online": true }` → `{ "online": true }` | on-shift toggle |
| `POST` | `/courier/shift/settle/` | → `{ "ok": true }` (clears cash-in-hand) | Cash "Settle shift" (see payments doc §5) |
| `POST` | `/courier/push-token/` | `{ "token":"ExpoPushToken[..]", "platform":"android" }` | register for push |
| `POST` | `/payments/create/` · `/payments/<id>/refund/` | see payments doc §3/§8 | QR / refund |

Reject illegal `step` jumps server-side (only forward along the lifecycle; the courier can't set
`READY` — kitchen does). `accept` requires the order be assigned to *this* courier and not expired.

### Response shapes (camelCase — exact)

```jsonc
// Courier
{ "first":"Jasur","last":"Rakhimov","initials":"JR","phone":"+998 90 123 45 67",
  "vehicle":"Scooter","plate":"01 A 777 BC","id":"CR-118","branch":"Alpha — Chilonzor",
  "rating":4.9,"online":true }

// ActiveOrder  (address.coords = null => text-only address, app shows no map pin)
{ "id":58, "step":"ASSIGNED", "payment":"UNPAID", "total":113000, "fee":15000,
  "placedAt":"19:35", "etaReady":"~6 min",
  "customer":{ "name":"Nigora A.", "phone":"+998 93 412 88 01" },
  "address":{ "text":"Bunyodkor ko'chasi 12, kv. 34", "landmark":"near Chilonzor metro",
              "coords":{ "lat":41.2853, "lng":69.2034 }, "distanceKm":2.4 },
  "lines":[ { "name":"Pitsa tovuqli katta", "qty":1, "price":85000 } ] }

// CompletedOrder
{ "id":51, "total":145000, "fee":18000, "payment":"PAID",
  "deliveredAt":"16:48", "minutes":19, "customer":{ "name":"Madina R." }, "area":"Novza" }

// Stats
{ "deliveries":4, "earnings":64000, "cashCollected":383000, "avgMinutes":22,
  "activeHours":"5h 12m", "distanceKm":31,
  "byHour":[ { "h":"10","n":0 }, { "h":"11","n":1 } ] }

// Notification  (icon ∈ scooter|checkcircle|banknote|wallet|close; tone ∈ primary|success|warning|error|info)
{ "id":"n2", "icon":"checkcircle", "tone":"success", "title":"Order #56 is ready",
  "body":"Ready for pickup at the counter.", "at":"19:32", "unread":true, "order":56 }

// Reconciliation  (SNAKE_CASE on the wire — see payments doc §5)
{ "collected_cash":383000, "qr_collected":221000, "delivery_fees":64000, "bonuses":15000,
  "tips":8000, "cash_orders":3, "qr_orders":2, "shift_start":"14:05",
  "handover_code":"ALP-4471", "net_payout":87000, "cash_in_hand":383000 }
```

---

## 4. WebSockets (Django Channels) — the realtime spine

Two consumers. **Every frame is `{ "event": "<name>", "data": { ...snake_case... } }`** (same envelope
the payment events already use, so the client parser is uniform).

### 4a. `CourierConsumer` — `/ws/courier/`  (the courier app connects)

Authenticate on connect (token via `?token=` query or subprotocol/header), join group `courier_<id>`.

**Server → courier (events the app subscribes to):**

| event | data | app reaction |
| --- | --- | --- |
| `order.assigned` | `{ order_id, total, fee, payment, customer:{name}, address:{text, distance_km}, expires_in:20 }` | **IncomingOrderSheet** springs up (countdown = `expires_in`s) + push |
| `order.ready` | `{ order_id }` | notification "Order #X is ready" + status pill → Ready |
| `order.status` | `{ order_id, step }` | update the order in active list / detail timeline |
| `order.cancelled` | `{ order_id, reason }` | remove from active; restores held balance (see payments doc §5) |
| `payment.paid` | `{ order_id, payment_id, provider, method, amount }` | flips QR "Waiting…"→Paid (payments doc §4) |
| `payment.refunded` | `{ order_id, payment_id }` | reverts order to unpaid |

**Courier → server (the app sends):**

| event | data | server action |
| --- | --- | --- |
| `location.ping` | `{ lat, lng }` | upsert `LocationPing`; **relay** to the order's cashier group (4b) as `courier.location`. Only honored while the courier's order step ∈ {PICKED_UP, ON_WAY} and `share_loc=true`. |

```python
# couriers/consumers.py  (reference)
class CourierConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.courier = self.scope["user"].courier            # auth'd on connect
        self.group = f"courier_{self.courier.id}"
        await self.channel_layer.group_add(self.group, self.channel_name); await self.accept()
    async def receive_json(self, content):
        if content.get("event") == "location.ping" and self.courier.share_loc:
            await save_ping(self.courier, content["data"])
            # relay to the cashier(s) watching this courier's active delivery
            await relay_location(self.courier, content["data"])
    # group_send handlers -> forward to socket as {event, data}
    async def order_event(self, m):    await self.send_json({"event": m["event"], "data": m["data"]})
    async def payment_event(self, m):  await self.send_json({"event": m["event"], "data": m["data"]})
```

### 4b. `CashierConsumer` — `/ws/cashier/` (or `/ws/branch/<branch_id>/`)  (the desktop POS connects)

The desktop joins `branch_<id>` (and/or `order_<id>`). **Server → cashier:**

| event | data | desktop reaction |
| --- | --- | --- |
| `courier.location` | `{ courier_id, order_id, lat, lng, at }` | move the courier marker on the map (the "translate courier location to cashier" requirement) |
| `order.status` | `{ order_id, courier_id, step }` | reflect ASSIGNED/PICKED_UP/ON_WAY/DELIVERED on the order |
| `order.delivered` | `{ order_id, courier_id, at }` | close the delivery |

```python
def relay_location(courier, data):
    order = courier.current_delivery()   # the PICKED_UP/ON_WAY order, if any
    if not order: return
    payload = {"courier_id": courier.code, "order_id": order.id,
               "lat": data["lat"], "lng": data["lng"], "at": now_iso()}
    async_to_sync(get_channel_layer().group_send)(
        f"branch_{order.branch_id}",
        {"type": "cashier.event", "event": "courier.location", "data": payload})
```

**One settlement function emits every order event** (so REST handlers + kitchen actions + webhooks
all funnel through it), e.g. `push_order_event(order, "order.ready", {"order_id": order.id})` which
group_sends to `courier_<id>` AND `branch_<id>`.

---

## 5. Location streaming details

- Courier app turns sharing on automatically at **PICKED_UP/ON_WAY** (and the "Share live location"
  toggle in Profile must be on). It sends `location.ping` over `/ws/courier/` roughly every **3–5 s**
  (and on significant movement). **REST `POST /courier/location/` is the fallback** when the socket
  is down — same effect.
- Server **upserts** the latest ping and **relays** it to the order's `branch_<id>` (and/or
  `order_<id>`) group as `courier.location` for the desktop.
- Stop relaying once the order is `DELIVERED` or sharing is off. Don't persist a long GPS trail unless
  you need history — last-known position is enough for the desktop map.
- Privacy: only relay to the **cashier branch that owns the active order**, only while delivering.

---

## 6. Push notifications (when the app is backgrounded)

WS covers the foreground; for background delivery use **Expo Push** (the app is Expo) or FCM.

- App registers its token: `POST /courier/push-token/`.
- Send a push at the same moments you emit the WS event:
  - **order.assigned** → "New order #X assigned — kitchen is preparing."
  - **order.ready** → "Order #X is ready — head to the counter."
  - **payment.paid** (optional) → "Payment received · #X".
- Keep titles/bodies short; deep-link payload `{ order_id }` so tapping opens the order.

> The app already renders an in-app banner for these; push is only for when it's not foregrounded.

---

## 7. Security (non-negotiable)

- **Auth every socket** on connect (token in query/subprotocol). Reject anonymous. Scope groups to the
  authenticated courier/branch — never let a courier subscribe to another's group or a cashier to
  another branch.
- **Never trust the client for `payment.paid`.** Paid is emitted only after a **verified provider
  webhook** (payments doc §1/§4). The phone only *renders* status.
- A courier may only `accept`/advance/`status` **their own** assigned order; reject cross-courier
  writes. `accept` must check the 20s window hasn't expired.
- Amounts are integer so'm; tiyin only at the provider boundary (payments doc).
- Validate `location.ping` (sane lat/lng, rate-limit) before relaying.

---

## 8. Mobile screen / state → backend touchpoint (quick map)

| Mobile | Needs |
| --- | --- |
| Login | `POST /auth/courier/login/` |
| Orders (Active/Completed, stats, balance pill) | `GET /courier/orders/active`, `/completed`, `/stats/today`, `/balance` |
| **New-order sheet** (IncomingOrderSheet, countdown, hold-to-accept) | `order.assigned` WS + `POST /orders/<id>/accept|decline/` |
| Order detail timeline + action button | `GET active`, `POST /orders/<id>/status/`, `order.ready`/`order.status` WS |
| "Sharing live location" (PICKED_UP/ON_WAY) | `location.ping` WS (→ desktop `courier.location`) |
| Collect payment → QR waiting → Paid | `POST /payments/create/`, `payment.paid` WS (payments doc) |
| Refund | `POST /payments/<id>/refund/`, `payment.refunded` WS |
| Cash tab + Settle/handover | `GET /courier/shift/reconciliation/`, `POST /courier/shift/settle/` |
| Notifications | `GET /courier/notifications/` (+ push §6) |
| Profile on-shift toggle | `POST /courier/shift/online/` |
| **Desktop (cashier)** courier-on-map | `/ws/cashier/` (or `/ws/branch/<id>/`) → `courier.location`, `order.status` |

---

## 9. Setup checklist

- `INSTALLED_APPS` + ASGI Channels routing exposing **`/ws/courier/`** and **`/ws/cashier/`** (or
  `/ws/branch/<id>/`); Redis channel layer; run under Daphne/Uvicorn.
- `manage.py makemigrations couriers orders payments && migrate`.
- DRF camelCase renderer for the read feeds (or hand-name fields); reconciliation + WS `data` stay snake_case.
- Env (adds to the payments doc's env): `CHANNELS_REDIS_URL`, `EXPO_ACCESS_TOKEN` (or FCM creds),
  plus the payment provider keys from the payments doc.
- Seed: a `Branch`, a `Courier` linked to a user, a couple of `DELIVERY` orders with assignments —
  so the app's feeds return real data.

## 10. Tests to write

- `order.assigned` emits to the right `courier_<id>` only; expired `accept` is rejected.
- Kitchen READY → `order.ready` WS + push fired once; idempotent.
- `status` transitions are forward-only and owner-scoped; illegal jump rejected.
- `location.ping` only relays while step ∈ {PICKED_UP, ON_WAY} and `share_loc`; relays to the correct
  branch group only.
- Payment paid only via verified webhook → `payment.paid` (payments doc §10).
- Cancellation restores the courier's held balance and emits `order.cancelled`.
