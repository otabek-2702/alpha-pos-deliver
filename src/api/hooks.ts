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
