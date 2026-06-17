/* ============================================================
   Order step → badge + primary action — ported from app/components.jsx
   (stepBadge, nextAction).
   ============================================================ */
import type { BadgeTone, ButtonVariant } from '@/components/ui';
import type { IconName } from '@/components/Icon';
import type { Step } from '@/api/types';

export type StepBadge = { label: string; tone: BadgeTone; dot: boolean };

export function stepBadge(step: Step): StepBadge {
  switch (step) {
    case 'ASSIGNED':
      return { label: 'Preparing', tone: 'warning', dot: true };
    case 'READY':
      return { label: 'Ready', tone: 'success', dot: true };
    case 'PICKED_UP':
      return { label: 'Picked up', tone: 'info', dot: true };
    case 'ON_WAY':
      return { label: 'On the way', tone: 'primary', dot: true };
    case 'DELIVERED':
      return { label: 'Delivered', tone: 'neutral', dot: false };
    default:
      return { label: step, tone: 'neutral', dot: false };
  }
}

export type NextAction = {
  label: string;
  icon: IconName;
  variant: ButtonVariant;
  disabled?: boolean;
  next: Step | null;
};

export function nextAction(step: Step): NextAction {
  switch (step) {
    case 'ASSIGNED':
      return {
        label: 'Waiting for kitchen',
        icon: 'clock',
        variant: 'ghost',
        disabled: true,
        next: 'READY',
      };
    case 'READY':
      return { label: 'Picked up order', icon: 'check', variant: 'dark', next: 'PICKED_UP' };
    case 'PICKED_UP':
      return { label: 'Start delivery', icon: 'navigation', variant: 'primary', next: 'ON_WAY' };
    case 'ON_WAY':
      return {
        label: 'Mark as delivered',
        icon: 'checkcircle',
        variant: 'success',
        next: 'DELIVERED',
      };
    case 'DELIVERED':
      return {
        label: 'Delivered',
        icon: 'checkcircle',
        variant: 'ghost',
        disabled: true,
        next: null,
      };
    default:
      return { label: '—', icon: 'check', variant: 'ghost', disabled: true, next: null };
  }
}
