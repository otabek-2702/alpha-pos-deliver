/* ============================================================
   Motion easings + durations — ported 1:1 from styles/motion.css
   (the three spring cubic-beziers + micro/ui durations). Timing-
   based (Easing.bezier) so it matches the CSS curves exactly.
   ============================================================ */
import { Easing, useReducedMotion as useRNReducedMotion } from 'react-native-reanimated';

export const EASE_SPRING = Easing.bezier(0.34, 1.56, 0.64, 1); // overshoot pop
export const EASE_SPRING_SOFT = Easing.bezier(0.22, 1, 0.36, 1); // settle, no overshoot
export const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);
export const EASE_IN_OUT = Easing.inOut(Easing.ease);

export const DUR = {
  micro: 180,
  ui: 260,
  entrance: 420,
  draw: 500,
  pop: 450,
  ripple: 800,
  countup: 900,
  odometer: 620,
  goal: 600,
} as const;

/** Reduced-motion flag (reanimated). When true, animators jump to final. */
export const useReducedMotion = useRNReducedMotion;
