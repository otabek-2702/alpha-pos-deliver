/* ============================================================
   Skeleton + SkeletonOrderCard — shimmer loaders (motion.jsx +
   motion.css .skel). A light band sweeps translateX over the base.
   Reduced-motion → static block (still legible as a loader).
   ============================================================ */
import React, { useEffect, useState } from 'react';
import { View, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@/theme/ThemeProvider';
import { Card } from '@/components/ui';
import { useReducedMotion } from './easings';

export function Skeleton({
  w = '100%',
  h = 12,
  r = 6,
  style,
}: {
  w?: DimensionValue;
  h?: number;
  r?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors, isDark } = useTheme();
  const reduce = useReducedMotion();
  const [width, setWidth] = useState(0);
  const p = useSharedValue(0);

  useEffect(() => {
    if (reduce) return;
    p.value = withRepeat(
      withTiming(1, { duration: 1300, easing: Easing.inOut(Easing.ease) }),
      -1,
      false,
    );
  }, [reduce, p]);

  const band = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(p.value, [0, 1], [-width, width]) }],
  }));

  return (
    <View
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={[
        {
          width: w,
          height: h,
          borderRadius: r,
          backgroundColor: colors.surfaceInset,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      {!reduce && width > 0 ? (
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: 0,
              bottom: 0,
              width: width * 0.6,
              backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.55)',
            },
            band,
          ]}
        />
      ) : null}
    </View>
  );
}

export function SkeletonOrderCard() {
  return (
    <Card padded>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Skeleton w={52} h={18} />
        <Skeleton w={80} h={22} r={6} />
        <View style={{ flex: 1 }} />
        <Skeleton w={38} h={14} />
      </View>
      <View style={{ marginTop: 14, gap: 9 }}>
        <Skeleton w="85%" h={13} />
        <Skeleton w="55%" h={13} />
      </View>
    </Card>
  );
}
