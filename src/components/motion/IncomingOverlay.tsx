/* ============================================================
   IncomingOverlay — global mount point for the new-order sheet,
   driven by the store (app.jsx renders IncomingOrderSheet when
   loggedIn && incoming). On accept: POST /orders/<id>/accept/ and
   refetch active orders; on dismiss: POST /orders/<id>/decline/.
   (Both client calls are no-ops in mock mode, so the demo still
   works offline.) Accept also bumps the orders tab badge.
   ============================================================ */
import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { acceptOrder, declineOrder } from '@/api/client';
import { qk } from '@/api/hooks';
import { useAppStore } from '@/store/appStore';
import { IncomingOrderSheet } from './IncomingOrderSheet';

export function IncomingOverlay() {
  const qc = useQueryClient();
  const loggedIn = useAppStore((s) => s.loggedIn);
  const incoming = useAppStore((s) => s.incoming);
  const acceptIncoming = useAppStore((s) => s.acceptIncoming);
  const dismissIncoming = useAppStore((s) => s.dismissIncoming);

  if (!loggedIn || !incoming) return null;

  const id = incoming.id;
  const onAccept = () => {
    acceptIncoming(); // optimistic: close sheet + bump badge
    void acceptOrder(id)
      .then(() => qc.invalidateQueries({ queryKey: qk.activeOrders }))
      .catch(() => {});
  };
  const onDismiss = () => {
    dismissIncoming();
    void declineOrder(id).catch(() => {});
  };

  return <IncomingOrderSheet order={incoming} onAccept={onAccept} onDismiss={onDismiss} />;
}
