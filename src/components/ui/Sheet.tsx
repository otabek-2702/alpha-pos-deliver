/* ============================================================
   Bottom sheet — .sheet-scrim + .sheet (grip, title, sub) from
   mobile.css. Scrim dims; panel slides up. Rendered as an absolute
   overlay inside the app surface (matches the prototype frame).
   ============================================================ */
import React, { useEffect, useState } from 'react';
import { Animated, Pressable, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from './Text';

export function Sheet({
  title,
  subtitle,
  onClose,
  children,
  testID,
}: {
  title?: string;
  subtitle?: string;
  onClose: () => void;
  children?: React.ReactNode;
  testID?: string;
}) {
  const { colors, radii, shadow, space } = useTheme();
  const [y] = useState(() => new Animated.Value(0));
  const [fade] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.timing(y, { toValue: 1, duration: 260, useNativeDriver: true }),
    ]).start();
  }, [fade, y]);

  const translateY = y.interpolate({ inputRange: [0, 1], outputRange: [600, 0] });

  return (
    <View style={{ position: 'absolute', inset: 0, zIndex: 70, justifyContent: 'flex-end' }}>
      <Animated.View
        style={{ position: 'absolute', inset: 0, backgroundColor: colors.overlay, opacity: fade }}
      >
        <Pressable
          testID={testID ? `${testID}-scrim` : undefined}
          style={{ flex: 1 }}
          onPress={onClose}
        />
      </Animated.View>
      <Animated.View
        testID={testID}
        style={{
          backgroundColor: colors.surface,
          borderTopLeftRadius: radii.xl,
          borderTopRightRadius: radii.xl,
          paddingTop: space[3],
          paddingHorizontal: space[4],
          paddingBottom: 30,
          transform: [{ translateY }],
          ...shadow.lg,
        }}
      >
        <View
          style={{
            width: 38,
            height: 5,
            borderRadius: 99,
            backgroundColor: colors.borderStrong,
            alignSelf: 'center',
            marginBottom: space[3],
          }}
        />
        {title ? (
          <Text
            variant="h3"
            weight="700"
            style={{ paddingHorizontal: space[1], marginBottom: space[1] }}
          >
            {title}
          </Text>
        ) : null}
        {subtitle ? (
          <Text
            variant="sm"
            color="textSecondary"
            style={{ paddingHorizontal: space[1], marginBottom: space[4] }}
          >
            {subtitle}
          </Text>
        ) : null}
        {children}
      </Animated.View>
    </View>
  );
}
