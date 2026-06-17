/* ============================================================
   useCourierRealtime — the app's persistent courier socket bridge.
   Opens /ws/courier/ while logged in (real mode) and turns the
   server's delivery-lifecycle frames into UI:
     order.assigned  → IncomingOrderSheet (store.receiveIncoming)
     order.ready     → "Order ready" push banner + refetch feeds
     order.status    → refetch active orders
     order.cancelled → refetch active orders
   In mock mode subscribeCourierEvents() is a no-op, so this is inert
   and the demo keeps driving the sheet via the Simulate button.
   ============================================================ */
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { qk } from '@/api/hooks';
import { subscribeCourierEvents } from '@/realtime/ws';
import { useAppStore } from '@/store/appStore';
import { useT } from '@/i18n';
import type { IncomingOrder, OrderPayment } from '@/api/types';

export function useCourierRealtime() {
  const qc = useQueryClient();
  const T = useT();
  const loggedIn = useAppStore((s) => s.loggedIn);
  const showPush = useAppStore((s) => s.showPush);

  useEffect(() => {
    if (!loggedIn) return;

    const ch = subscribeCourierEvents((f) => {
      const d = f.data as Record<string, unknown>;
      const orderId = typeof d.order_id === 'number' ? d.order_id : undefined;

      switch (f.event) {
        case 'order.assigned': {
          if (orderId == null) break;
          const addr = (d.address ?? {}) as { text?: string; distance_km?: number | null };
          const cust = (d.customer ?? {}) as { name?: string };
          const incoming: IncomingOrder = {
            id: orderId,
            total: typeof d.total === 'number' ? d.total : 0,
            fee: typeof d.fee === 'number' ? d.fee : 0,
            payment: (d.payment === 'PAID' ? 'PAID' : 'UNPAID') as OrderPayment,
            customer: { name: cust.name ?? '' },
            address: { text: addr.text ?? '', distanceKm: addr.distance_km ?? 0 },
          };
          useAppStore.getState().receiveIncoming(incoming);
          break;
        }
        case 'order.ready': {
          showPush({
            icon: 'checkcircle',
            title: T('order_ready_title') + (orderId != null ? ` · #${orderId}` : ''),
            body: T('order_ready_body'),
          });
          void qc.invalidateQueries({ queryKey: qk.activeOrders });
          void qc.invalidateQueries({ queryKey: qk.notifications });
          break;
        }
        case 'order.status':
        case 'order.cancelled': {
          void qc.invalidateQueries({ queryKey: qk.activeOrders });
          void qc.invalidateQueries({ queryKey: qk.completed });
          break;
        }
        default:
          break; // payment.* / connected handled elsewhere or ignored
      }
    });

    return () => ch.close();
  }, [loggedIn, qc, showPush, T]);
}
