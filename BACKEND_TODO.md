> ## ✅ RESOLVED (verified 2026-06 against commit `156c2a8`)
> The backend dev shipped **all** of the items below: payments (`create`/`refund`/`webhook`
> + `payment.paid`/`payment.refunded` WS), a real payment/settlement **ledger** behind
> `balance` + `reconciliation`, `settle` that writes a `CourierSettlement`, **persisted**
> notifications + `notifications/read/`, a `share-location/` toggle, `logout`, and GPS-trail
> `distanceKm`. His 28 tests pass; I verified every endpoint live (the cash money-loop
> 0 → 50 000 → refund → 0 included).
>
> **One app↔backend contract gap I fixed app-side** (not a backend defect): the backend is
> record-only with a `CASH/CARD/QR` provider vocabulary + UPPERCASE status; the app was built
> for gateway providers (`payme`) + lowercase. The app now maps `cash→CASH` / gateway→`QR`,
> tolerates uppercase status + any provider string on the `payment.paid` frame, and records
> cash collections so the ledger receives them. Everything below is now DONE — kept for history.

---

# Backend — what still needs to be built (for the backend dev)

Audited the courier app ↔ `alpha_pos_server` (latest `main`, commit `acad2e7`) end to end:
every REST endpoint + WS event the app calls, against `couriers/` on the server. The
delivery lifecycle (assign → ready → pickup → on-way → delivered) and the courier→cashier
GPS relay are **fully implemented and verified live**. What's below is everything still
missing or stubbed.

## 1. The old backend TODO list — NOT done

All 9 `# TODO payments doc §5` markers in `couriers/views.py` are still open. They all
depend on a **payments ledger that doesn't exist yet**:

| Endpoint | Field | Current | Should be |
|---|---|---|---|
| `GET /courier/balance/` | `balance` | hardcoded `0` | net payable to the courier |
| `GET /courier/balance/` | `ledger` | hardcoded `[]` | settlement ledger rows `{at,kind,order,amount,label}` |
| `GET /courier/stats/today/` | `distanceKm` | hardcoded `0` | summed from a GPS trail (not persisted — `LocationPing` keeps only the latest point) |
| `GET /courier/shift/reconciliation/` | `qr_collected` | `0` | real QR/card total |
| `GET /courier/shift/reconciliation/` | `bonuses` | `0` | real |
| `GET /courier/shift/reconciliation/` | `tips` | `0` | real |
| `GET /courier/shift/reconciliation/` | `qr_orders` | `0` | real count |
| `GET /courier/shift/reconciliation/` | `net_payout` | `= delivery_fees` | net of QR/bonuses/tips/cash |
| `POST /courier/shift/settle/` | whole body | returns `{ok:true}`, writes nothing | write the settlement ledger row + reset held cash |

App impact: the Cash screen's **Recent activity** is empty, **Your payout** shows `0`, and the
**Distance** KPI on Today is always `0 km`.

## 2. Payments — entirely missing (biggest blocker)

The app's QR/cash payment flow calls routes this backend does not mount:

- `POST /payments/create/` — app posts `{order_id, provider, amount}`, expects
  `{payment_id, status, link}` (`createPaymentResponseSchema`). **404 today** → the QR screen
  falls back to a fake local pay-link and can never confirm a real payment.
- `POST /payments/<id>/refund/` — app posts here for refunds; **404 today**.
- **WS `payment.paid`** — the QR screen flips "Waiting…" → "Paid" ONLY on this server event
  (correct: never trust the client). Nothing in `couriers/` emits it, so a real QR payment
  never completes in-app.
- **WS `payment.refunded`** — order detail reverts to UNPAID only on this event; never emitted.

Security model is already correct on the app side (paid only via verified webhook → WS). The
backend needs the payment provider integration + webhook → `payment.paid`/`payment.refunded`
fan-out on `/ws/courier/` (same `{event,data}` envelope as the order events).

Also note: **cash collection isn't recorded** either — the app marks cash "paid" locally; once
`/payments/create/` exists it should accept `provider:"cash"` so cash collections reconcile too.

## 3. Smaller endpoints the app wants

- **Share-location toggle** — the Profile "Share live location" switch has no endpoint. Add
  `POST /courier/shift/share-location/ {share:bool}` (or fold `share` into `shift/online/`).
  `Courier.share_loc` already exists and already gates the GPS relay; it's just not settable.
- **Notifications are synthetic + permanently unread** — `/courier/notifications/` is built on
  the fly from assignments with `unread: True` always. There's no persisted Notification model
  and no **mark-as-read** endpoint, so the app's bell badge can never clear. Add a
  `Notification` table + `POST /courier/notifications/read/`.
- **Logout** — `POST /auth/courier/logout/` to invalidate the session. The app logout only
  clears the local token; the server session stays valid until its 7-day TTL. (Optional for
  token auth, but recommended.)
- **GPS trail** — persist `LocationPing` history (or a distance accumulator) so `stats.distanceKm`
  can be real.

## 4. What the app now does (so you can test against it)

The app is wired to call (all verified 200 against a local run): `setOnline`
(`/courier/shift/online/`), `settleShift` (`/courier/shift/settle/`), `acceptOrder`/`declineOrder`/
`updateOrderStatus` (`/orders/<id>/...`), `registerPushToken` (`/courier/push-token/`), plus all
the read feeds. It opens a persistent `/ws/courier/` socket and reacts to `order.assigned`
(→ incoming sheet, using the server's `expires_in` for the accept countdown), `order.ready`,
`order.status`, `order.cancelled`.

Still **not** sent by the app (needs a native dep + a small amount of app work, tracked
separately): live `location.ping` streaming (needs `expo-location` + a WS-send helper) and
obtaining an Expo push token (needs `expo-notifications`). The backend side for both already
exists and is verified.
