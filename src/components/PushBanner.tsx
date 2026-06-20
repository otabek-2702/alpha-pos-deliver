/* ============================================================
   PushBanner — iOS-style push notification (app/components.jsx).
   Slides in from the top, auto-dismisses after 5.2s, tap to open.
   (Backdrop blur is approximated with a high-opacity surface — RN
   has no CSS backdrop-filter; see README deltas.)
   ============================================================ */
import React, { useEffect, useState } from 'react';
import { Animated, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';
import { Icon, type IconName } from '@/components/Icon';
import { Text } from '@/components/ui';
import type { PushData } from '@/store/appStore';

export function PushBanner({
  data,
  onClose,
  onOpen,
}: {
  data: PushData;
  onClose: () => void;
  onOpen: () => void;
}) {
  const { colors, shadow, space } = useTheme();
  const insets = useSafeAreaInsets();
  const [y] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.timing(y, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    const t = setTimeout(onClose, 5200);
    return () => clearTimeout(t);
    // re-arm whenever a new push arrives
  }, [data, onClose, y]);

  const translateY = y.interpolate({ inputRange: [0, 1], outputRange: [-160, 0] });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: insets.top + 4,
        left: 10,
        right: 10,
        zIndex: 90,
        transform: [{ translateY }],
      }}
    >
      <Pressable onPress={onOpen}>
        <View
          style={{
            flexDirection: 'row',
            gap: space[3],
            paddingHorizontal: 14,
            paddingTop: 12,
            paddingBottom: 14,
            borderRadius: 22,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            ...shadow.lg,
          }}
        >
          <View
            style={{
              width: 38,
              height: 38,
              borderRadius: 9,
              backgroundColor: data.bg ?? colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name={(data.icon as IconName) ?? 'scooter'} size={20} color="#fff" />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text
                variant="micro"
                weight="700"
                color="textTertiary"
                style={{ letterSpacing: 0.04 * 11, textTransform: 'uppercase', flex: 1 }}
              >
                Alfa POS Courier
              </Text>
              <Text variant="micro" color="textTertiary">
                now
              </Text>
            </View>
            <Text variant="sm" weight="700" style={{ marginTop: 1 }}>
              {data.title}
            </Text>
            <Text variant="sm" color="textSecondary" style={{ marginTop: 1 }}>
              {data.body}
            </Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}
