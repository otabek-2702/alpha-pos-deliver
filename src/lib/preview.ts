/* ============================================================
   Order-stage preview — the design Tweak that drives the first
   active order's step (app/app.jsx: CDB.active[0].step = …).
   Kept so the lifecycle is screenshot-able at any stage.
   ============================================================ */
import type { ActiveOrder, Step } from '@/api/types';
import type { OrderStagePreview } from '@/store/appStore';

const STATE_MAP: Record<OrderStagePreview, Step> = {
  Assigned: 'ASSIGNED',
  Ready: 'READY',
  'On the way': 'ON_WAY',
  Delivered: 'DELIVERED',
};

/** Return orders with the first order's step overridden by the preview. */
export function applyOrderStagePreview(
  orders: ActiveOrder[],
  stage: OrderStagePreview,
): ActiveOrder[] {
  if (orders.length === 0) return orders;
  const [first, ...rest] = orders;
  return [{ ...first!, step: STATE_MAP[stage] }, ...rest];
}
