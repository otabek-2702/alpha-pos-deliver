/* ============================================================
   Button — ports .btn and its variants (primary/success/dark/
   secondary/ghost) + sizes (md 52px / sm 44px) from mobile.css.
   Press feedback = translateY(1), matching the prototype.
   ============================================================ */
import React from 'react';
import { Pressable, View, type ViewStyle, type StyleProp } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Icon, type IconName } from '@/components/Icon';
import { Text } from './Text';

export type ButtonVariant = 'primary' | 'success' | 'dark' | 'secondary' | 'ghost';
export type ButtonSize = 'md' | 'sm';

export type ButtonProps = {
  title?: string;
  iconName?: IconName;
  iconSize?: number;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  textColor?: string;
  children?: React.ReactNode;
  testID?: string;
};

export function Button({
  title,
  iconName,
  iconSize = 20,
  variant = 'primary',
  size = 'md',
  disabled = false,
  onPress,
  style,
  textColor,
  children,
  testID,
}: ButtonProps) {
  const { colors, radii, space } = useTheme();

  const fills: Record<ButtonVariant, { bg: string; fg: string; border: string }> = {
    primary: { bg: colors.primary, fg: colors.onPrimary, border: 'transparent' },
    success: { bg: colors.success, fg: '#fff', border: 'transparent' },
    dark: { bg: colors.ink, fg: colors.inkFg, border: 'transparent' },
    secondary: { bg: colors.surface, fg: colors.text, border: colors.borderStrong },
    ghost: { bg: colors.surfaceInset, fg: colors.text, border: 'transparent' },
  };
  const v = fills[variant];
  const fg = textColor ?? v.fg;

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        {
          height: size === 'sm' ? 44 : 52,
          width: '100%',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: space[2],
          paddingHorizontal: space[5],
          borderRadius: radii.md,
          borderWidth: 1,
          borderColor: v.border,
          backgroundColor: v.bg,
          opacity: disabled ? 0.5 : 1,
          transform: [{ scale: pressed ? 0.96 : 1 }],
        },
        style,
      ]}
    >
      {children ?? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space[2] }}>
          {iconName ? <Icon name={iconName} size={iconSize} color={fg} /> : null}
          {title ? (
            <Text weight="700" color={fg} style={{ fontSize: size === 'sm' ? 14 : 16 }}>
              {title}
            </Text>
          ) : null}
        </View>
      )}
    </Pressable>
  );
}
