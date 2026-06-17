# Alpha POS — Courier Payments & Collection
## Backend integration spec (Django + DRF + Channels)

> **What this is.** A build-against blueprint for the payment/collection feature
> prototyped in `Courier App.html`. It is a specification + reference sketches — not a
> tested codebase. Treat the Python below as a starting implementation to adapt to your
> repo's conventions, then write migrations and run the test suite yourself.
>
> **Stack assumed (unchanged):** Django + DRF, PostgreSQL, Redis, Channels (WebSockets),
> `paytechuz` for Payme/Click/Uzum/Paynet. Region UZ, currency UZS. Amounts are integers;
> where a provider requires tiyin, multiply by 100 at the boundary only.

---

## 1. Principles (non-negotiable)

- **Never trust client-reported success.** The courier app only *requests* a charge and
  *renders* status. A payment becomes `paid` exclusively when a **signed provider webhook**
  is verified server-side. The phone's "Paid ✓" is driven by a WebSocket event the server
  emits *after* that verification.
- **Extend, don't rewrite, order/status logic.** `Payment` is a new sibling of `Order`.
  Order status transitions stay where they are; payment only flips an order's
  `is_paid`/derived `payment_state` via a single service call + signal.
- **Money is integer UZS.** Store `amount` as `BigIntegerField` (so'm). Convert to tiyin
  (`amount * 100`) only inside a provider adapter that demands it.
- **One order can have many payments** (split: part cash + part card). An order is settled
  when `sum(payments.paid.amount) >= order.total`.

---

## 2. Data model

```python
# payments/models.py
from django.db import models
from django.utils import timezone

class PaymentProvider(models.TextChoices):
    CASH        = "cash",        "Cash"
    PAYME       = "payme",       "Payme"
    CLICK       = "click",       "Click"
    UZUM        = "uzum",        "Uzum"
    PAYNET      = "paynet",      "Paynet"
    UNIFIED_QR  = "unified_qr",  "Unified QR (bank)"   # 2026-07-01 readiness

class PaymentStatus(models.TextChoices):
    PENDING  = "pending",  "Pending"
    PAID     = "paid",     "Paid"
    FAILED   = "failed",   "Failed"
    REFUNDED = "refunded", "Refunded"
    PARTIAL  = "partial",  "Partial"     # reserved for partially-captured/!fully refunded

class Payment(models.Model):
    order          = models.ForeignKey("orders.Order", related_name="payments",
                                       on_delete=models.PROTECT)
    courier        = models.ForeignKey("couriers.Courier", null=True, blank=True,
                                       on_delete=models.SET_NULL)
    provider       = models.CharField(max_length=16, choices=PaymentProvider.choices)
    amount         = models.BigIntegerField()                 # integer so'm
    status         = models.CharField(max_length=12, choices=PaymentStatus.choices,
                                      default=PaymentStatus.PENDING)
    provider_txn_id= models.CharField(max_length=128, blank=True, default="", db_index=True)
    qr_payload     = models.TextField(blank=True, default="")  # raw pay-link encoded in QR
    is_test_mode   = models.BooleanField(default=False)
    idempotency_key= models.CharField(max_length=64, unique=True)  # guards double-charge
    created_at     = models.DateTimeField(auto_now_add=True)
    paid_at        = models.DateTimeField(null=True, blank=True)
    meta           = models.JSONField(default=dict, blank=True)    # ofd url, change, etc.

    class Meta:
        indexes = [models.Index(fields=["order", "status"]),
                   models.Index(fields=["provider", "provider_txn_id"])]
```

**Split payments** are simply ≥2 `Payment` rows on one order (e.g. one `cash` + one
`payme`). A `Order.payment_state` property derives from its payments:

```python
# orders/models.py  (add a property — do NOT touch existing status logic)
@property
def amount_paid(self):
    return sum(p.amount for p in self.payments.filter(status="paid"))

@property
def payment_state(self):
    if self.amount_paid >= self.total: return "paid"
    if self.amount_paid > 0:           return "partial"
    return "unpaid"
```

---

## 3. Service layer

```python
# payments/services.py
import uuid, qrcode, base64
from io import BytesIO
from django.db import transaction
from paytechuz.gateways import create_gateway   # see PayTechUZ docs for exact import

def _qr_png_b64(text: str) -> str:
    img = qrcode.make(text)                      # qrcode lib
    buf = BytesIO(); img.save(buf, format="PNG")
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()

@transaction.atomic
def create_payment(*, order, provider, amount, courier=None, is_test_mode=False):
    """Create a PENDING payment and, for online providers, a dynamic pay-link + QR.
       Returns (payment, {"link":..., "qr_png":...}) for QR providers, else (payment, {})."""
    payment = Payment.objects.create(
        order=order, courier=courier, provider=provider, amount=amount,
        is_test_mode=is_test_mode, idempotency_key=uuid.uuid4().hex,
    )
    if provider == PaymentProvider.CASH:
        return payment, {}

    gateway = create_gateway(provider, test_mode=is_test_mode)   # PayTechUZ unified iface
    # Most gateways: amount in tiyin, an account dict mapping to your order id.
    link = gateway.create_payment(
        id=payment.id, amount=amount * 100, account={"order_id": order.id},
        return_url=settings.PAY_RETURN_URL,
    )
    payment.qr_payload = link
    payment.save(update_fields=["qr_payload"])
    return payment, {"link": link, "qr_png": _qr_png_b64(link)}
```

> The prototype draws a stylized QR client-side; **production must encode the real
> `link`** from `create_payment` (via the `qrcode` lib above, or render `qr_payload` on the
> device). Never have the phone invent the pay-link.

---

## 4. Webhooks → realtime (the heart of it)

PayTechUZ ships provider webhook handlers (Payme JSON-RPC, Click prepare/complete, etc.).
Mount them, and on a verified `paid` callback, run **one** settlement function that (a)
marks the payment, (b) fiscalizes, (c) pushes a Channels event.

```python
# payments/settlement.py
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from django.utils import timezone

def mark_paid(payment, provider_txn_id):
    if payment.status == "paid":                 # idempotent — webhooks retry
        return
    payment.status = "paid"
    payment.provider_txn_id = provider_txn_id
    payment.paid_at = timezone.now()
    payment.save(update_fields=["status", "provider_txn_id", "paid_at"])

    maybe_fiscalize(payment)                      # §6, no-op-safe
    order = payment.order
    _push(f"courier_{order.courier_id}", "payment.paid", _order_payload(order, payment))
    _push(f"order_{order.id}",          "payment.paid", _order_payload(order, payment))

def _push(group, event, data):
    async_to_sync(get_channel_layer().group_send)(
        group, {"type": "payment.event", "event": event, "data": data})
```

```python
# payments/webhooks.py  — wire PayTechUZ's verified callbacks to mark_paid
# PayTechUZ verifies signatures/auth per provider; do NOT bypass it.
class PaymeWebhook(PaytechuzPaymeWebhookView):       # subclass the lib's view
    def on_payment_success(self, transaction):       # called only after verification
        mark_paid(Payment.objects.get(id=transaction.account["order_id_payment"]),
                  transaction.id)
    def on_payment_cancel(self, transaction):
        p = Payment.objects.get(...); p.status = "failed"; p.save()
```

```python
# couriers/consumers.py  — courier subscribes to courier_<id>
class CourierConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.group = f"courier_{self.scope['user'].courier.id}"
        await self.channel_layer.group_add(self.group, self.channel_name)
        await self.accept()
    async def payment_event(self, msg):              # -> {"event":"payment.paid", ...}
        await self.send_json({"event": msg["event"], "data": msg["data"]})
```

**Client mapping (prototype → prod):** in `app/payments.jsx → QRPayScreen`, replace the
simulated `setTimeout` with a WS subscription; on `payment.paid` for this order, call the
existing `onPaid(method)` to flip to the success view. Everything else stays.

---

## 5. Cash flow + shift reconciliation

Cash delivery records a `cash` Payment with the collected amount (store change in `meta`).
Per-courier reconciliation endpoint backing the app's **Cash** tab:

```python
# couriers/api.py
class ShiftReconciliationView(APIView):
    def get(self, request):
        shift = current_shift(request.user.courier)
        paid  = Payment.objects.filter(courier=shift.courier, paid_at__gte=shift.started_at,
                                       status="paid")
        cash  = paid.filter(provider="cash")
        return Response({
            "collected_cash":  cash.aggregate(s=Sum("amount"))["s"] or 0,   # owed to company
            "qr_collected":    paid.exclude(provider="cash").aggregate(s=Sum("amount"))["s"] or 0,
            "delivery_fees":   shift.delivery_fees,
            "bonuses":         shift.bonuses,
            "tips":            shift.tips,
            "net_payout":      shift.delivery_fees + shift.bonuses + shift.tips,
            "cash_in_hand":    (cash.aggregate(s=Sum("amount"))["s"] or 0) - shift.handed_over,
            "handover_code":   shift.handover_code,    # cashier scans/keys this to settle
        })
```

`POST /shift/settle/` records a cash hand-off (courier → cashier), zeroes `cash_in_hand`,
and is what clears the courier's negative balance for already-paid orders. The **balance
goes negative** the moment an unpaid order is assigned (held liability) and is restored
when its payment reaches `paid` **or** the cashier cancels it — both are server events, not
client actions.

---

## 6. Unified QR readiness (bank-issued, required 2026-07-01)

Abstract it now so the bank's acquiring QR plugs in without a refactor:

```python
# payments/providers/unified_qr.py
from abc import ABC, abstractmethod

class UnifiedQRProvider(ABC):
    """Bank-issued unified QR (NBU/HUMO acquiring). Static = one code per courier/branch;
       dynamic = per-order code with amount. Plug a concrete acquirer in here."""
    @abstractmethod
    def issue_static(self, *, merchant_id: str, courier_id: str) -> str: ...
    @abstractmethod
    def issue_dynamic(self, *, order_id: str, amount: int) -> dict:      # {"payload","txn_id"}
        ...
    @abstractmethod
    def verify_webhook(self, request) -> dict:                           # signed callback
        ...

class StubUnifiedQR(UnifiedQRProvider):
    # TODO(2026-07): replace with the acquiring bank's SDK once contracts are signed.
    def issue_static(self, **k):  raise NotImplementedError("Awaiting bank onboarding")
    def issue_dynamic(self, **k): raise NotImplementedError("Awaiting bank onboarding")
    def verify_webhook(self, request): raise NotImplementedError
```

Route `provider == "unified_qr"` through this interface in `create_payment`; the webhook +
`mark_paid` path is already provider-agnostic, so settlement needs no changes.

---

## 7. Fiscalization hook (ofd.uz) — optional, setting-gated

```python
# payments/fiscal.py
from django.conf import settings
def maybe_fiscalize(payment):
    if not settings.FISCALIZATION_ENABLED:        # no-op-safe
        return
    if payment.provider in ("payme",):            # Payme receipts API
        url = ofd_set_fiscal_data(payment)        # returns ofd.uz qr_code_url
        payment.meta["ofd_qr_url"] = url
        payment.save(update_fields=["meta"])
```

Called from `mark_paid` after status flips. The app shows "Fiscal receipt sent · ofd.uz"
when `meta.ofd_qr_url` is present.

---

## 8. Refunds

```python
# POST /payments/<id>/refund/
@transaction.atomic
def refund_payment(payment, reason=""):
    if payment.status != "paid": raise ValidationError("Only paid payments refundable")
    if payment.provider != "cash":
        create_gateway(payment.provider, payment.is_test_mode).cancel(payment.provider_txn_id)
    payment.status = "refunded"; payment.meta["refund_reason"] = reason
    payment.save(update_fields=["status", "meta"])
    _push(f"courier_{payment.order.courier_id}", "payment.refunded",
          _order_payload(payment.order, payment))
```

Used for failed/returned orders; emits a WS event so the app reverts the order to unpaid
(prototype already models this in `OrderDetail`'s refund action).

---

## 9. Payment state machine (allowed transitions)

```
pending ──(verified webhook)──▶ paid ──(refund)──▶ refunded
   │                             │
   └──(cancel/timeout)─▶ failed  └──(partial capture)─▶ partial
```
Enforce in `Payment.save()` or a small `transition()` helper; reject illegal jumps.
`paid` is terminal except for `refunded`. All transitions are server-driven.

---

## 10. Tests to write (state machine + webhooks)

- `pending → paid` only via a **signature-valid** webhook; invalid signature ⇒ stays pending.
- Webhook **idempotency**: same callback twice ⇒ one `paid`, one WS emit.
- **Split**: cash 57 000 + payme 56 000 on a 113 000 order ⇒ `order.payment_state == "paid"`.
- Client cannot mark paid: hitting any "paid" endpoint from the app is rejected.
- Refund: `paid → refunded` emits `payment.refunded`; `pending → refund` rejected.
- Tiyin boundary: 113 000 so'm ⇒ gateway receives 11 300 000.
- Reconciliation totals match seeded payments for a shift window.

---

## 11. Setup notes

**Env vars**
```
PAYME_MERCHANT_ID, PAYME_KEY, PAYME_TEST_KEY
CLICK_SERVICE_ID, CLICK_MERCHANT_ID, CLICK_SECRET
UZUM_MERCHANT_ID, UZUM_SECRET
PAYNET_MERCHANT_ID, PAYNET_SECRET
PAYTECHUZ_TEST_MODE=true|false
PAY_RETURN_URL=https://app.alphapos.uz/pay/return
FISCALIZATION_ENABLED=false           # flip on once OFD contract is live
OFD_API_KEY / OFD_ENDPOINT            # ofd.uz
CHANNELS_REDIS_URL=redis://...
```

**Migrations:** `manage.py makemigrations payments && manage.py migrate`.

**Provider dashboards to register the webhook URL in**
- **Payme** (Merchant Cabinet → Cashbox → set JSON-RPC endpoint) — `/webhooks/payme/`
- **Click** (Merchant area → SHOP-API: Prepare/Complete URLs) — `/webhooks/click/`
- **Uzum** (Merchant portal) — `/webhooks/uzum/`
- **Paynet** (partner cabinet) — `/webhooks/paynet/`
- **Unified QR**: pending acquiring-bank onboarding (NBU/processing center) for 2026-07-01.

**ASGI:** ensure Channels routing exposes `CourierConsumer` (`/ws/courier/`) and the order
consumer; run under Daphne/Uvicorn with the Redis channel layer.

---

## 12. Credentials you still need to obtain
1. Production **merchant IDs + secret keys** for Payme, Click, Uzum, Paynet (and their test
   credentials for `is_test_mode`).
2. **ofd.uz** API key + the fiscal module/contract for receipts.
3. **Acquiring-bank agreement** for the bank-issued **Unified QR** (gov-mandated 2026-07-01)
   — this unlocks `StubUnifiedQR` → real implementation.
4. Public HTTPS callback host registered in each provider dashboard.
```
```
