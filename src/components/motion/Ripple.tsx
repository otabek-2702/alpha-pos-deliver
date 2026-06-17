/* ============================================================
   Ripple — success/white ring expanding from center (motion.css
   .ripple). scale .5→2.4 + opacity .55→0 over 800ms ease-out.
   ============================================================ */
import React, { useEffect } from 'react';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { DUR, EASE_OUT, useReducedMotion } from './easings';

export function Ripple({ color, size = 120 }: { color: string; size?: number }) {
  const reduce = useReducedMotion();
  const scale = useSharedValue(0.5);
  const opacity = useSharedValue(reduce ? 0 : 0.55);

  useEffect(() => {
    if (reduce) {
      opacity.value = 0;
      return;
    }
    scale.value = withTiming(2.4, { duration: DUR.ripple, easing: EASE_OUT });
    opacity.value = withTiming(0, { duration: DUR.ripple, easing: EASE_OUT });
  }, [reduce, scale, opacity]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: size,
          height: size,
          marginLeft: -size / 2,
          marginTop: -size / 2,
          borderRadius: 999,
          borderWidth: 3,
          borderColor: color,
        },
        style,
      ]}
    />
  );
}
