/* ============================================================
   Text primitive — picks the correct Hanken Grotesk / JetBrains
   Mono face per weight (RN can't synthesize weight on custom
   fonts), applies a type-scale variant, and resolves a color
   token. `mono` enables tabular numerals (font-variant: tnum).
   ============================================================ */
import React from 'react';
import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import type { ColorTokens, TypeVariant } from '@/theme/tokens';
import type { FontWeightToken } from '@/theme/fonts';

export type ColorValue = keyof ColorTokens | (string & {});

export type TextProps = RNTextProps & {
  variant?: TypeVariant;
  weight?: FontWeightToken;
  mono?: boolean;
  color?: ColorValue;
};

export function resolveColor(colors: ColorTokens, color?: ColorValue): string | undefined {
  if (!color) return undefined;
  if (color in colors) return colors[color as keyof ColorTokens];
  return color as string;
}

export function Text({
  variant,
  weight = '400',
  mono = false,
  color,
  style,
  children,
  ...rest
}: TextProps) {
  const theme = useTheme();
  const base: TextStyle = {
    fontFamily: theme.font(mono ? 'mono' : 'sans', weight),
    color: resolveColor(theme.colors, color) ?? theme.colors.text,
  };
  if (variant) {
    base.fontSize = theme.type[variant].fontSize;
    base.lineHeight = theme.type[variant].lineHeight;
  }
  if (mono) {
    base.fontVariant = ['tabular-nums'];
    base.letterSpacing = -0.02 * (base.fontSize ?? 14);
  }
  return (
    <RNText style={[base, style]} {...rest}>
      {children}
    </RNText>
  );
}
