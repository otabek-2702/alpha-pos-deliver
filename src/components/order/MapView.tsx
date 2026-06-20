/* ============================================================
   MapView — stylized SVG map (components.jsx MapView) + motion:
   live-location ring pulse (meRing) and route self-draw
   (strokeDashoffset 360→0). Reduced-motion → static dashed route.
   ============================================================ */
import React, { useEffect } from 'react';
import { View } from 'react-native';
import Svg, { G, Path, Rect } from 'react-native-svg';
import Animated, {
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@/theme/ThemeProvider';
import { Icon } from '@/components/Icon';
import { Text } from '@/components/ui';
import { EASE_OUT, useReducedMotion } from '@/components/motion';
import type { ActiveOrder } from '@/api/types';

const APath = Animated.createAnimatedComponent(Path);

export function MapView({ order }: { order: ActiveOrder }) {
  const { colors, isDark, shadow } = useTheme();
  const reduce = useReducedMotion();
  const a = order.address;

  // route draw
  const dash = useSharedValue(reduce ? 0 : 360);
  // live-location ring
  const ring = useSharedValue(0);

  useEffect(() => {
    if (reduce) {
      dash.value = 0;
      return;
    }
    dash.value = withDelay(200, withTiming(0, { duration: 1400, easing: EASE_OUT }));
    ring.value = withRepeat(withTiming(1, { duration: 1800, easing: EASE_OUT }), -1, false);
  }, [reduce, dash, ring]);

  const routeProps = useAnimatedProps(() => ({ strokeDashoffset: dash.value }));
  const ringStyle = useAnimatedStyle(() => ({
    opacity: 0.6 * (1 - ring.value),
    transform: [{ scale: 0.7 + ring.value * 2.3 }],
  }));

  return (
    <View
      style={{
        position: 'relative',
        height: 170,
        overflow: 'hidden',
        backgroundColor: isDark ? '#1A2230' : '#E8EDE9',
      }}
    >
      <Svg
        width="100%"
        height={170}
        viewBox="0 0 402 170"
        preserveAspectRatio="xMidYMid slice"
        style={{ position: 'absolute', inset: 0, opacity: 0.9 }}
      >
        <G stroke="#C5D2C8" strokeWidth={9} opacity={0.9} fill="none">
          <Path d="M-10 40 H420" />
          <Path d="M-10 120 H420" />
          <Path d="M70 -10 V180" />
          <Path d="M260 -10 V180" />
        </G>
        <G stroke="#D4DDD7" strokeWidth={4} fill="none">
          <Path d="M-10 80 H420" />
          <Path d="M160 -10 V180" />
          <Path d="M340 -10 V180" />
        </G>
        <Rect x={90} y={52} width={48} height={48} fill="#D8E2DA" rx={3} />
        <Rect x={280} y={92} width={44} height={40} fill="#D8E2DA" rx={3} />
        <Rect x={18} y={92} width={38} height={44} fill="#D8E2DA" rx={3} />
      </Svg>
      <Svg
        width="100%"
        height={170}
        viewBox="0 0 402 170"
        preserveAspectRatio="none"
        style={{ position: 'absolute', inset: 0 }}
      >
        {reduce ? (
          <Path
            d="M70 120 L70 80 L260 80 L260 40"
            fill="none"
            stroke={colors.primary}
            strokeWidth={4.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="2 11"
            opacity={0.9}
          />
        ) : (
          <APath
            d="M70 120 L70 80 L260 80 L260 40"
            fill="none"
            stroke={colors.primary}
            strokeWidth={4.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={360}
            animatedProps={routeProps}
            opacity={0.9}
          />
        )}
      </Svg>

      {/* me marker + live-location ring */}
      <View style={{ position: 'absolute', left: '17.4%', top: '70.6%' }}>
        {!reduce ? (
          <Animated.View
            pointerEvents="none"
            style={[
              {
                position: 'absolute',
                left: -9,
                top: -9,
                width: 18,
                height: 18,
                borderRadius: 99,
                borderWidth: 2,
                borderColor: colors.primary,
              },
              ringStyle,
            ]}
          />
        ) : null}
        <View
          style={{
            width: 16,
            height: 16,
            marginLeft: -8,
            marginTop: -8,
            borderRadius: 99,
            backgroundColor: colors.primary,
            borderWidth: 3,
            borderColor: '#fff',
          }}
        />
      </View>

      <View
        style={{
          position: 'absolute',
          left: '64.7%',
          top: '23.5%',
          transform: [{ translateX: -17 }, { translateY: -34 }],
        }}
      >
        {/* Prototype's drop-off pin inherits the brand color (currentColor), not red. */}
        <Icon name="pin" size={34} weight={2} color={colors.primary} />
      </View>

      <View
        style={{
          position: 'absolute',
          top: 10,
          left: 10,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          height: 28,
          paddingHorizontal: 10,
          borderRadius: 99,
          backgroundColor: colors.surface,
          ...shadow.sm,
        }}
      >
        <Icon name="store" size={13} color={colors.text} />
        <Text variant="label" weight="600">
          Drop-off
        </Text>
      </View>

      {a.distanceKm != null ? (
        <View
          style={{
            position: 'absolute',
            bottom: 10,
            right: 10,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 5,
            height: 28,
            paddingHorizontal: 11,
            borderRadius: 99,
            backgroundColor: colors.text,
          }}
        >
          <Icon name="navigation" size={12} color="#fff" />
          <Text variant="label" weight="600" mono color="#fff">
            {a.distanceKm} km
          </Text>
        </View>
      ) : null}
    </View>
  );
}
