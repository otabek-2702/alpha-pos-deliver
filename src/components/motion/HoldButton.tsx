/* ============================================================
   HoldButton — press-and-hold fill → drawn checkmark
   (motion.jsx HoldButton). .hold__fill scaleX 0→1 over holdMs while
   held; release before full resets; on full → DrawCheck pop +
   onComplete (+440ms) + success haptic. Reduced-motion → instant.
   ============================================================ */
import React, { useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@/theme/ThemeProvider';
import { Icon } from '@/components/Icon';
import { Text } from '@/components/ui';
import { DrawCheck } from './DrawCheck';
import { useReducedMotion } from './easings';

export function HoldButton({
  label,
  doneLabel,
  onComplete,
  holdMs = 850,
  testID,
}: {
  label: string;
  doneLabel: string;
  onComplete?: () => void;
  holdMs?: number;
  testID?: string;
}) {
  const { colors, radii, space } = useTheme();
  const reduce = useReducedMotion();
  const fill = useSharedValue(0);
  const [filling, setFilling] = useState(false);
  const [done, setDone] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  function finish() {
    if (timer.current) clearTimeout(timer.current);
    fill.value = 1;
    setFilling(false);
    setDone(true);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => onComplete?.(), 440);
  }

  function begin() {
    if (done) return;
    if (reduce) {
      finish();
      return;
    }
    setFilling(true);
    fill.value = withTiming(1, { duration: holdMs, easing: Easing.linear });
    timer.current = setTimeout(finish, holdMs);
  }

  function end() {
    if (done) return;
    if (timer.current) clearTimeout(timer.current);
    setFilling(false);
    fill.value = withTiming(0, { duration: 200 });
  }

  const fillStyle = useAnimatedStyle(() => ({ transform: [{ scaleX: fill.value }] }));
  const labelColor = filling || done ? '#fff' : colors.primary;

  return (
    <Pressable testID={testID} onPressIn={begin} onPressOut={end} delayLongPress={holdMs + 500}>
      <View
        style={{
          height: 52,
          width: '100%',
          borderRadius: radii.md,
          borderWidth: 1.5,
          borderColor: colors.primaryBorder,
          backgroundColor: done ? colors.primary : colors.surfaceInset,
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: 0,
              left: 0,
              bottom: 0,
              right: 0,
              backgroundColor: colors.primary,
              transformOrigin: 'left',
            },
            fillStyle,
          ]}
        />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space[2] }}>
          {done ? (
            <DrawCheck size={22} stroke="#fff" pop />
          ) : (
            <Icon name="check" size={20} color={labelColor} />
          )}
          <Text weight="700" color={labelColor} style={{ fontSize: 16 }}>
            {done ? doneLabel : label}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
