/* ============================================================
   QrCard — the white QR card with motion: breathing pulse ring
   (motion.css .qrcard.is-waiting qrBreathe) + Skia scanning
   shimmer (.qr-shimmer). Reduced-motion → static card.
   ============================================================ */
import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from '@/components/ui';
import { EASE_IN_OUT, QrShimmer, useReducedMotion } from '@/components/motion';
import { QRCode } from './QRCode';

const CARD = 276; // 232 QR + 44 padding

export function QrCard({ payload }: { payload: string }) {
  const { colors, radii, shadow, space } = useTheme();
  const reduce = useReducedMotion();
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (reduce) return;
    pulse.value = withRepeat(withTiming(1, { duration: 1300, easing: EASE_IN_OUT }), -1, true);
  }, [reduce, pulse]);

  const ringStyle = useAnimatedStyle(() => ({
    opacity: 0.45 * pulse.value,
    transform: [{ scale: 1 + pulse.value * 0.05 }],
  }));

  return (
    <View
      style={{
        marginTop: space[5],
        width: CARD,
        height: CARD,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {!reduce ? (
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: 'absolute',
              width: CARD,
              height: CARD,
              borderRadius: radii.xl,
              borderWidth: 3,
              borderColor: colors.primary,
            },
            ringStyle,
          ]}
        />
      ) : null}
      <View style={{ backgroundColor: '#fff', borderRadius: radii.xl, padding: 22, ...shadow.lg }}>
        <QRCode payload={payload} size={232} />
        <View
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: [{ translateX: -26 }, { translateY: -26 }],
            width: 52,
            height: 52,
            borderRadius: 13,
            backgroundColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 6,
            borderColor: '#fff',
          }}
        >
          <Text weight="700" color="#fff" style={{ fontSize: 22 }}>
            A
          </Text>
        </View>
        <QrShimmer size={CARD} radius={radii.xl} />
      </View>
    </View>
  );
}
