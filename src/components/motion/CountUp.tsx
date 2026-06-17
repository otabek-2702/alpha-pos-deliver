/* ============================================================
   CountUp — numeric tween 0→value (motion.jsx CountUp). rAF +
   easeOutCubic, 900ms. Reduced-motion → final value instantly.
   ============================================================ */
import React, { useEffect, useRef, useState } from 'react';
import type { TextStyle, StyleProp } from 'react-native';
import { Text } from '@/components/ui';
import type { FontWeightToken } from '@/theme/fonts';
import type { ColorValue } from '@/components/ui';
import { DUR, useReducedMotion } from './easings';

export function CountUp({
  value,
  format,
  duration = DUR.countup,
  mono = true,
  weight = '700',
  color,
  style,
}: {
  value: number;
  format?: (n: number) => string;
  duration?: number;
  mono?: boolean;
  weight?: FontWeightToken;
  color?: ColorValue;
  style?: StyleProp<TextStyle>;
}) {
  const reduce = useReducedMotion();
  const [n, setN] = useState(reduce ? value : 0);
  const raf = useRef(0);

  useEffect(() => {
    if (reduce) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setN(value);
      return;
    }
    const start = Date.now();
    const tick = () => {
      const p = Math.min(1, (Date.now() - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(value * eased);
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [value, reduce, duration]);

  const fmt = format ?? ((x: number) => moneyGroup(Math.round(x)));
  return (
    <Text mono={mono} weight={weight} color={color} style={style}>
      {fmt(n)}
    </Text>
  );
}

function moneyGroup(n: number): string {
  return String(Math.round(Math.abs(n))).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}
