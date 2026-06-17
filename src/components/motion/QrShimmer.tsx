/* ============================================================
   QrShimmer — rotating conic sweep around the QR card edge
   (motion.css .qr-shimmer), drawn with Skia (SweepGradient).
   Skipped under reduced motion. Sits absolutely over the QR card.
   ============================================================ */
import React, { useEffect } from 'react';
import { Canvas, RoundedRect, SweepGradient, vec, Group } from '@shopify/react-native-skia';
import {
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '@/theme/ThemeProvider';
import { useReducedMotion } from './easings';

export function QrShimmer({ size, radius = 20 }: { size: number; radius?: number }) {
  const { colors } = useTheme();
  const reduce = useReducedMotion();
  const rot = useSharedValue(0);

  useEffect(() => {
    if (reduce) return;
    rot.value = withRepeat(
      withTiming(2 * Math.PI, { duration: 2200, easing: Easing.linear }),
      -1,
      false,
    );
  }, [reduce, rot]);

  const c = size / 2;
  const transform = useDerivedValue(() => [{ rotate: rot.value }]);

  if (reduce) return null;

  return (
    <Canvas
      style={{ position: 'absolute', left: -3, top: -3, width: size, height: size }}
      pointerEvents="none"
    >
      <Group origin={vec(c, c)} transform={transform}>
        <RoundedRect
          x={2}
          y={2}
          width={size - 4}
          height={size - 4}
          r={radius}
          style="stroke"
          strokeWidth={4}
        >
          <SweepGradient
            c={vec(c, c)}
            colors={['transparent', 'transparent', colors.primary, 'transparent']}
            positions={[0, 0.69, 0.89, 1]}
          />
        </RoundedRect>
      </Group>
    </Canvas>
  );
}
