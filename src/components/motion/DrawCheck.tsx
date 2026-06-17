/* ============================================================
   DrawCheck — self-drawing checkmark (motion.jsx DrawCheck + the
   drawRing/drawTick/pop keyframes). Ring (dash 152) then tick
   (dash 30, +120ms) draw over 500ms ease-out; optional pop scale.
   Reduced-motion → fully drawn instantly.
   ============================================================ */
import React, { useEffect } from 'react';
import Animated, {
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import { DUR, EASE_OUT, EASE_SPRING, useReducedMotion } from './easings';

const ACircle = Animated.createAnimatedComponent(Circle);
const APath = Animated.createAnimatedComponent(Path);

export function DrawCheck({
  size = 64,
  stroke = '#16a34a',
  pop = false,
}: {
  size?: number;
  stroke?: string;
  pop?: boolean;
}) {
  const reduce = useReducedMotion();
  const ring = useSharedValue(reduce ? 0 : 152);
  const tick = useSharedValue(reduce ? 0 : 30);
  const scale = useSharedValue(reduce || !pop ? 1 : 0.4);

  useEffect(() => {
    if (reduce) {
      ring.value = 0;
      tick.value = 0;
      scale.value = 1;
      return;
    }
    ring.value = withTiming(0, { duration: DUR.draw, easing: EASE_OUT });
    tick.value = withDelay(120, withTiming(0, { duration: DUR.draw, easing: EASE_OUT }));
    if (pop) scale.value = withTiming(1, { duration: DUR.pop, easing: EASE_SPRING });
  }, [reduce, pop, ring, tick, scale]);

  const ringProps = useAnimatedProps(() => ({ strokeDashoffset: ring.value }));
  const tickProps = useAnimatedProps(() => ({ strokeDashoffset: tick.value }));
  const boxStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={boxStyle}>
      <Svg width={size} height={size} viewBox="0 0 52 52" fill="none">
        <ACircle
          cx={26}
          cy={26}
          r={24}
          stroke={stroke}
          strokeWidth={3}
          strokeDasharray={152}
          animatedProps={ringProps}
        />
        <APath
          d="M15 27 l7 7 l15 -16"
          stroke={stroke}
          strokeWidth={4}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={30}
          animatedProps={tickProps}
        />
      </Svg>
    </Animated.View>
  );
}
