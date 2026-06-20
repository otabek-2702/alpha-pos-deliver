/* ============================================================
   Server-state hooks (TanStack Query) over the typed client.
   ============================================================ */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as client from './client';

export const qk = {
  courier: ['courier'] as const,
  activeOrders: ['orders', 'active'] as const,
  completed: ['orders', 'completed'] as const,
  stats: ['stats'] as const,
  balance: ['balance'] as const,
  notifications: ['notifications'] as const,
  recon: ['recon'] as const,
};

export const useCourier = () => useQuery({ queryKey: qk.courier, queryFn: client.getCourier });
export const useActiveOrders = () =>
  useQuery({ queryKey: qk.activeOrders, queryFn: client.getActiveOrders });
export const useCompletedOrders = () =>
  useQuery({ queryKey: qk.completed, queryFn: client.getCompletedOrders });
export const useStats = () => useQuery({ queryKey: qk.stats, queryFn: client.getStats });
export const useBalance = () => useQuery({ queryKey: qk.balance, queryFn: client.getBalance });
export const useNotifications = () =>
  useQuery({ queryKey: qk.notifications, queryFn: client.getNotifications });
export const useReconciliation = () =>
  useQuery({ queryKey: qk.recon, queryFn: client.getReconciliation });

/** Toggle on-shift availability on the server (POST /courier/shift/online/).
 *  Invalidates the courier profile so `online` reflects server truth. */
export const useSetOnline = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: client.setOnline,
    onSuccess: () => void qc.invalidateQueries({ queryKey: qk.courier }),
  });
};

/** Settle the shift / hand over cash (POST /courier/shift/settle/).
 *  Invalidates reconciliation + balance so the cash figures refresh. */
export const useSettleShift = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: client.settleShift,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.recon });
      void qc.invalidateQueries({ queryKey: qk.balance });
    },
  });
};

export const useCreatePayment = () => useMutation({ mutationFn: client.createPayment });

export const useRefundPayment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: client.refundPayment,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.balance });
      void qc.invalidateQueries({ queryKey: qk.activeOrders });
    },
  });
};

export const useLogin = () => useMutation({ mutationFn: client.login });
