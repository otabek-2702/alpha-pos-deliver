/* ============================================================
   RingCountdown — depleting circular ring + mono seconds
   (motion.jsx RingCountdown). Ring stroke-dashoffset depletes over
   the window; color primary → warning(≤6s) → error(≤3s); ≤5s the
   ring pulses (urgentPulse). svg rotated -90° so it drains from top.
   ============================================================ */
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from '@/components/ui';
import { EASE_IN_OUT, useReducedMotion } from './easings';

const ACircle = Animated.createAnimatedComponent(Circle);
const R = 28;
const CIRC = 2 * Math.PI * R;

export function RingCountdown({
  seconds = 20,
  onExpire,
}: {
  seconds?: number;
  onExpire?: () => void;
}) {
  const { colors } = useTheme();
  const reduce = useReducedMotion();
  const [left, setLeft] = useState(seconds);
  const offset = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    if (reduce) return;
    offset.value = withTiming(CIRC, { duration: seconds * 1000, easing: Easing.linear });
    const start = Date.now();
    const iv = setInterval(() => {
      const l = Math.max(0, seconds - (Date.now() - start) / 1000);
      setLeft(l);
      if (l <= 0) {
        clearInterval(iv);
        onExpire?.();
      }
    }, 100);
    return () => clearInterval(iv);
    // run once on mount (matches prototype's [] deps)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const urgent = left <= 5;
  useEffect(() => {
    if (reduce) return;
    if (urgent) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.04, { duration: 250, easing: EASE_IN_OUT }),
          withTiming(1, { duration: 250, easing: EASE_IN_OUT }),
        ),
        -1,
        false,
      );
    } else {
      scale.value = withTiming(1, { duration: 150 });
    }
  }, [urgent, reduce, scale]);

  const color = left <= 3 ? colors.error : left <= 6 ? colors.warning : colors.primary;
  const ringProps = useAnimatedProps(() => ({ strokeDashoffset: offset.value }));
  const boxStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={[{ width: 64, height: 64 }, boxStyle]}>
      <Svg width={64} height={64} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={32} cy={32} r={R} fill="none" stroke={colors.surfaceInset} strokeWidth={5} />
        <ACircle
          cx={32}
          cy={32}
          r={R}
          fill="none"
          stroke={color}
          strokeWidth={5}
          strokeLinecap="round"
          strokeDasharray={CIRC}
          animatedProps={ringProps}
        />
      </Svg>
      <View
        style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' }}
      >
        <Text mono weight="700" style={{ fontSize: 20, letterSpacing: -0.02 * 20, color }}>
          {Math.ceil(left)}
        </Text>
      </View>
    </Animated.View>
  );
}
