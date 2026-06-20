/* ============================================================
   zod schemas — validate API/WS payloads at the boundary.
   Real endpoints (BACKEND_INTEGRATION.md): the courier order feed,
   the shift reconciliation view (§5), create_payment (§3), and the
   Channels WS events (§4/§8). snake_case API shapes are transformed
   into the camelCase domain types the app consumes.
   ============================================================ */
import { z } from 'zod';

export const stepSchema = z.enum(['ASSIGNED', 'READY', 'PICKED_UP', 'ON_WAY', 'DELIVERED']);
export const orderPaymentSchema = z.enum(['PAID', 'UNPAID']);

export const coordsSchema = z.object({ lat: z.number(), lng: z.number() });
export const addressSchema = z.object({
  text: z.string(),
  landmark: z.string().optional(),
  coords: coordsSchema.nullable(),
  // Tolerant on purpose: a backend may omit the key (text-only address) OR send
  // null. `.optional()` alone rejects null and would blank the orders screen.
  distanceKm: z.number().nullable().optional(),
});
export const orderLineSchema = z.object({
  name: z.string(),
  qty: z.number().int(),
  price: z.number().int(),
});

export const activeOrderSchema = z.object({
  id: z.number().int(),
  step: stepSchema,
  payment: orderPaymentSchema,
  total: z.number().int(),
  fee: z.number().int(),
  placedAt: z.string(),
  etaReady: z.string(),
  customer: z.object({ name: z.string(), phone: z.string() }),
  address: addressSchema,
  lines: z.array(orderLineSchema),
});

export const completedOrderSchema = z.object({
  id: z.number().int(),
  total: z.number().int(),
  fee: z.number().int(),
  payment: orderPaymentSchema,
  deliveredAt: z.string(),
  minutes: z.number().int(),
  customer: z.object({ name: z.string() }),
  area: z.string(),
});

/* ---- Shift reconciliation (snake_case API → camelCase domain) ---- */
export const reconciliationApiSchema = z
  .object({
    collected_cash: z.number(),
    qr_collected: z.number(),
    delivery_fees: z.number(),
    bonuses: z.number(),
    tips: z.number(),
    cash_orders: z.number().int().optional().default(0),
    qr_orders: z.number().int().optional().default(0),
    shift_start: z.string().optional().default(''),
    handover_code: z.string(),
    net_payout: z.number(),
    cash_in_hand: z.number(),
  })
  .transform((r) => ({
    collectedCash: r.collected_cash,
    qrCollected: r.qr_collected,
    deliveryFees: r.delivery_fees,
    bonuses: r.bonuses,
    tips: r.tips,
    cashOrders: r.cash_orders,
    qrOrders: r.qr_orders,
    shiftStart: r.shift_start,
    handoverCode: r.handover_code,
    netEarnings: r.delivery_fees + r.bonuses + r.tips,
    cashInHand: r.cash_in_hand,
    netPayout: r.net_payout,
  }));

/* ---- create_payment response (§3) ---- */
export const createPaymentResponseSchema = z.object({
  payment_id: z.number().int(),
  // The record-only backend returns UPPERCASE status (PAID/PENDING/REFUNDED/
  // FAILED); lowercase it so the app's state is uniform.
  status: z
    .string()
    .transform((s) => s.toLowerCase())
    .pipe(z.enum(['pending', 'paid', 'failed', 'refunded', 'partial'])),
  link: z.string().optional(),
  qr_png: z.string().optional(),
});
export type CreatePaymentResponse = z.infer<typeof createPaymentResponseSchema>;

/* ---- Realtime WS event (§4/§8) ---- */
export const paymentEventSchema = z.object({
  event: z.enum(['payment.paid', 'payment.refunded']),
  data: z.object({
    order_id: z.number().int(),
    payment_id: z.number().int().optional(),
    // The backend's courier-payment vocabulary is CASH / CARD / QR (uppercase);
    // mock mode emits gateway names (payme/click/…). Accept any string and let
    // the UI pretty-print it — never reject the frame on an unknown provider.
    provider: z.string().optional(),
    method: z.string().optional(),
    amount: z.number().optional(),
    status: z.string().optional(),
    is_paid: z.boolean().optional(),
  }),
});

/* ---- Courier realtime frames (§4): order.assigned / order.ready /
   order.status / order.cancelled, all on the SAME /ws/courier/ socket as the
   payment events. Parsed permissively (the socket also carries payment.* and a
   `connected` hello frame); the handler switches on `event`. ---- */
export const courierFrameSchema = z.object({
  event: z.string(),
  data: z.record(z.string(), z.unknown()).default({}),
});
export type CourierFrame = z.infer<typeof courierFrameSchema>;

/** Parse with a clear error context. */
export function validate<T>(schema: z.ZodType<T>, data: unknown, ctx: string): T {
  const r = schema.safeParse(data);
  if (!r.success) {
    throw new Error(`[validate:${ctx}] ${r.error.message}`);
  }
  return r.data;
}
