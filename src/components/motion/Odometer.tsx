/* ============================================================
   Odometer — rolling mono digits (motion.jsx Odometer). Each digit
   is a 0–9 column translated to its target; rolls from 0 on mount,
   re-rolls on change. 620ms ease-spring-soft. Reduced-motion → final.
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
import { Text } from '@/components/ui';
import { DUR, EASE_SPRING_SOFT, useReducedMotion } from './easings';

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

function DigitColumn({
  digit,
  fontSize,
  color,
  delay,
}: {
  digit: number;
  fontSize: number;
  color?: string;
  delay: number;
}) {
  const reduce = useReducedMotion();
  const cell = fontSize;
  const y = useSharedValue(reduce ? -digit * cell : 0);

  useEffect(() => {
    if (reduce) {
      y.value = -digit * cell;
      return;
    }
    y.value = withDelay(
      delay,
      withTiming(-digit * cell, { duration: DUR.odometer, easing: EASE_SPRING_SOFT }),
    );
  }, [digit, cell, delay, reduce, y]);

  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));

  return (
    <View style={{ height: cell, overflow: 'hidden' }}>
      <Animated.View style={style}>
        {DIGITS.map((n) => (
          <Text
            key={n}
            mono
            weight="700"
            color={color}
            style={{ height: cell, fontSize, lineHeight: cell, textAlign: 'center' }}
          >
            {n}
          </Text>
        ))}
      </Animated.View>
    </View>
  );
}

export function Odometer({
  value,
  format,
  delay = 0,
  fontSize = 19,
  color,
}: {
  value: number;
  format?: (n: number) => string;
  delay?: number;
  fontSize?: number;
  color?: string;
}) {
  const { colors } = useTheme();
  const target = (format ?? ((n: number) => moneyGroup(n)))(value);
  const resolved = color ?? colors.text;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
      {target.split('').map((ch, i) =>
        /\d/.test(ch) ? (
          <DigitColumn
            key={i}
            digit={parseInt(ch, 10)}
            fontSize={fontSize}
            color={resolved}
            delay={delay}
          />
        ) : (
          <Text
            key={i}
            mono
            weight="700"
            color={resolved}
            style={{ fontSize, lineHeight: fontSize }}
          >
            {ch}
          </Text>
        ),
      )}
    </View>
  );
}

// local default formatter == lib/format.money (avoid import cycle weight)
function moneyGroup(n: number): string {
  return String(Math.round(Math.abs(n))).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}
