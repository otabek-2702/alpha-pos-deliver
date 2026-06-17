/* ============================================================
   GoalBar — daily-goal progress (motion.jsx GoalBar). Width 0→pct%
   spring (600ms ease-spring-soft). Reduced-motion → final.
   ============================================================ */
import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@/theme/ThemeProvider';
import { DUR, EASE_SPRING_SOFT, useReducedMotion } from './easings';

export function GoalBar({ value, max }: { value: number; max: number }) {
  const { colors } = useTheme();
  const reduce = useReducedMotion();
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const w = useSharedValue(reduce ? pct : 0);

  useEffect(() => {
    if (reduce) {
      w.value = pct;
      return;
    }
    w.value = withDelay(80, withTiming(pct, { duration: DUR.goal, easing: EASE_SPRING_SOFT }));
  }, [pct, reduce, w]);

  const fill = useAnimatedStyle(() => ({ width: `${w.value}%` }));

  return (
    <View
      style={{
        height: 8,
        borderRadius: 999,
        backgroundColor: colors.surfaceInset,
        overflow: 'hidden',
      }}
    >
      <Animated.View
        style={[{ height: '100%', borderRadius: 999, backgroundColor: colors.primary }, fill]}
      />
    </View>
  );
}
