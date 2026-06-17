/* ============================================================
   PullToRefresh — custom, pan-driven branded ring → skeletons
   (motion.jsx PullToRefresh). Drag down at scrollTop 0: a branded
   ring grows/rotates with the drag; past threshold → spins and
   swaps in skeleton cards ~1s, then restores. Reduced-motion → no
   pull (renders children directly).
   ============================================================ */
import React, { useRef, useState } from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedProps,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '@/theme/ThemeProvider';
import { EASE_SPRING_SOFT, useReducedMotion } from './easings';

const ACircle = Animated.createAnimatedComponent(Circle);
const THRESH = 64;

export function PullToRefresh({
  onRefresh,
  renderSkeleton,
  children,
  contentContainerStyle,
  testID,
}: {
  onRefresh?: () => void;
  renderSkeleton?: () => React.ReactNode;
  children: React.ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  const { colors } = useTheme();
  const reduce = useReducedMotion();
  const scrollRef = useRef(null);
  const scrollY = useSharedValue(0);
  const pull = useSharedValue(0);
  const spin = useSharedValue(0);
  const isRefreshing = useSharedValue(0);
  const [refreshing, setRefreshing] = useState(false);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => (scrollY.value = e.contentOffset.y),
  });

  function startRefresh() {
    setRefreshing(true);
    isRefreshing.value = 1;
    pull.value = withTiming(THRESH, { duration: 160 });
    spin.value = withRepeat(withTiming(1, { duration: 700, easing: Easing.linear }), -1, false);
    setTimeout(() => {
      isRefreshing.value = 0;
      spin.value = 0;
      pull.value = withTiming(0, { duration: 260, easing: EASE_SPRING_SOFT });
      setRefreshing(false);
      onRefresh?.();
    }, 1000);
  }

  const pan = Gesture.Pan()
    .enabled(!reduce)
    // eslint-disable-next-line react-hooks/refs
    .simultaneousWithExternalGesture(scrollRef)
    .onUpdate((e) => {
      if (isRefreshing.value) return;
      if (scrollY.value > 2 || e.translationY <= 0) {
        pull.value = 0;
        return;
      }
      pull.value = Math.min(THRESH + 24, e.translationY * 0.5);
    })
    .onEnd(() => {
      if (isRefreshing.value) return;
      if (pull.value >= THRESH) {
        runOnJS(startRefresh)();
      } else {
        pull.value = withTiming(0, { duration: 260, easing: EASE_SPRING_SOFT });
      }
    });

  const headerStyle = useAnimatedStyle(() => ({
    height: pull.value,
    opacity: Math.min(1, pull.value / 40),
  }));
  const ringStyle = useAnimatedStyle(() => {
    const rot = isRefreshing.value ? spin.value * 360 : Math.min(360, (pull.value / THRESH) * 320);
    return { transform: [{ rotate: `${rot}deg` }] };
  });
  const ringProps = useAnimatedProps(() => {
    const rot = Math.min(360, (pull.value / THRESH) * 320);
    return { strokeDashoffset: isRefreshing.value ? 14 : 56 - (rot / 360) * 56 };
  });

  return (
    <GestureDetector gesture={pan}>
      <Animated.ScrollView
        ref={scrollRef}
        testID={testID}
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={contentContainerStyle}
      >
        <Animated.View
          style={[
            { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
            headerStyle,
          ]}
        >
          <Animated.View style={ringStyle}>
            <Svg width={22} height={22} viewBox="0 0 24 24">
              <ACircle
                cx={12}
                cy={12}
                r={9}
                fill="none"
                stroke={colors.primary}
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeDasharray={56}
                animatedProps={ringProps}
              />
            </Svg>
          </Animated.View>
        </Animated.View>
        {refreshing && renderSkeleton ? renderSkeleton() : children}
      </Animated.ScrollView>
    </GestureDetector>
  );
}
