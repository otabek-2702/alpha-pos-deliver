/* ============================================================
   RollDigits — split-flap reveal for the handover code
   (motion.jsx RollDigits + rollIn keyframe). Each char rotateX
   -90°→0 + opacity, staggered 50ms, 500ms ease-spring.
   Reduced-motion → plain text.
   ============================================================ */
import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@/theme/ThemeProvider';
import { EASE_SPRING, useReducedMotion } from './easings';

function RollChar({
  char,
  index,
  fontSize,
  color,
  letterSpacing,
}: {
  char: string;
  index: number;
  fontSize: number;
  color: string;
  letterSpacing: number;
}) {
  const { font } = useTheme();
  const reduce = useReducedMotion();
  const p = useSharedValue(reduce ? 1 : 0);

  useEffect(() => {
    if (reduce) {
      p.value = 1;
      return;
    }
    p.value = withDelay(index * 50, withTiming(1, { duration: 500, easing: EASE_SPRING }));
  }, [reduce, index, p]);

  const style = useAnimatedStyle(() => ({
    opacity: p.value,
    transform: [{ perspective: 400 }, { rotateX: `${(p.value - 1) * 90}deg` }],
  }));

  return (
    <Animated.Text
      style={[
        {
          fontFamily: font('mono', '700'),
          fontSize,
          color,
          letterSpacing,
          fontVariant: ['tabular-nums'],
        },
        style,
      ]}
    >
      {char}
    </Animated.Text>
  );
}

export function RollDigits({
  text,
  fontSize = 30,
  color,
  letterSpacing = 0.08 * 30,
}: {
  text: string;
  fontSize?: number;
  color?: string;
  letterSpacing?: number;
}) {
  const { colors } = useTheme();
  const resolved = color ?? colors.text;
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
      {String(text)
        .split('')
        .map((c, i) => (
          <RollChar
            key={i}
            char={c}
            index={i}
            fontSize={fontSize}
            color={resolved}
            letterSpacing={letterSpacing}
          />
        ))}
    </View>
  );
}
