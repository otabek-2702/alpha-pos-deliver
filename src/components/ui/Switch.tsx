/* ============================================================
   Switch — .switch from mobile.css. 42×24 pill, white knob that
   slides 18px; track turns success-green when on.
   ============================================================ */
import React, { useEffect, useState } from 'react';
import { Animated, Pressable } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';

export function Switch({
  on,
  onToggle,
  testID,
}: {
  on: boolean;
  onToggle?: () => void;
  testID?: string;
}) {
  const { colors, shadow } = useTheme();
  const [x] = useState(() => new Animated.Value(on ? 1 : 0));

  useEffect(() => {
    Animated.timing(x, { toValue: on ? 1 : 0, duration: 180, useNativeDriver: true }).start();
  }, [on, x]);

  const translateX = x.interpolate({ inputRange: [0, 1], outputRange: [0, 18] });

  return (
    <Pressable
      testID={testID}
      onPress={onToggle}
      accessibilityRole="switch"
      accessibilityState={{ checked: on }}
      style={{
        width: 42,
        height: 24,
        borderRadius: 99,
        backgroundColor: on ? colors.success : colors.borderStrong,
        justifyContent: 'center',
      }}
    >
      <Animated.View
        style={{
          position: 'absolute',
          left: 2,
          width: 20,
          height: 20,
          borderRadius: 99,
          backgroundColor: '#fff',
          transform: [{ translateX }],
          ...shadow.sm,
        }}
      />
    </Pressable>
  );
}
