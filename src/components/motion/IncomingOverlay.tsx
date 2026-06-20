/* ============================================================
   IncomingOverlay — global mount point for the new-order sheet,
   driven by the store. Three distinct outcomes:
     • accept  → optimistic close+badge, POST /orders/<id>/accept/;
                 on server rejection roll the badge back + warn.
     • decline → POST /orders/<id>/decline/ (frees it for reassign).
     • dismiss → scrim tap / countdown timeout: close LOCALLY only.
                 The server's accept window expires on its own — we
                 must NOT actively decline on a passive timeout.
   All client calls are no-ops in mock mode, so the demo still works.
   ============================================================ */
import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { acceptOrder, declineOrder } from '@/api/client';
import { qk } from '@/api/hooks';
import { useAppStore } from '@/store/appStore';
import { useT } from '@/i18n';
import { IncomingOrderSheet } from './IncomingOrderSheet';

export function IncomingOverlay() {
  const qc = useQueryClient();
  const T = useT();
  const loggedIn = useAppStore((s) => s.loggedIn);
  const incoming = useAppStore((s) => s.incoming);
  const acceptIncoming = useAppStore((s) => s.acceptIncoming);
  const rollbackAccept = useAppStore((s) => s.rollbackAccept);
  const dismissIncoming = useAppStore((s) => s.dismissIncoming);
  const showPush = useAppStore((s) => s.showPush);

  if (!loggedIn || !incoming) return null;

  const id = incoming.id;

  const onAccept = () => {
    acceptIncoming(); // optimistic: close sheet + bump badge
    void acceptOrder(id)
      .then(() => qc.invalidateQueries({ queryKey: qk.activeOrders }))
      .catch(() => {
        // server rejected (window expired / reassigned) — undo + tell the courier
        rollbackAccept();
        showPush({ icon: 'info', title: T('order_taken_title'), body: T('order_taken_body') });
      });
  };

  const onDecline = () => {
    dismissIncoming();
    void declineOrder(id).catch(() => {});
  };

  // scrim tap / countdown timeout: close locally, do NOT decline server-side
  const onDismiss = () => dismissIncoming();

  return (
    <IncomingOrderSheet
      key={id}
      order={incoming}
      onAccept={onAccept}
      onDecline={onDecline}
      onDismiss={onDismiss}
    />
  );
}
