/* ============================================================
   Badge — .badge + tone variants (success/warning/error/info/
   primary/neutral) and the optional leading dot, from mobile.css.
   ============================================================ */
import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import type { ColorTokens } from '@/theme/tokens';
import { Text } from './Text';

export type BadgeTone = 'success' | 'warning' | 'error' | 'info' | 'primary' | 'neutral';

export function Badge({
  tone,
  dot = false,
  children,
  style,
}: {
  tone: BadgeTone;
  dot?: boolean;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors, radii } = useTheme();

  const map: Record<
    BadgeTone,
    { bg: keyof ColorTokens; fg: keyof ColorTokens; bd: keyof ColorTokens }
  > = {
    success: { bg: 'successWeak', fg: 'successStrong', bd: 'successBorder' },
    warning: { bg: 'warningWeak', fg: 'warningStrong', bd: 'warningBorder' },
    error: { bg: 'errorWeak', fg: 'errorStrong', bd: 'errorBorder' },
    info: { bg: 'infoWeak', fg: 'infoStrong', bd: 'infoBorder' },
    primary: { bg: 'primaryWeak', fg: 'primary', bd: 'primaryBorder' },
    neutral: { bg: 'neutralWeak', fg: 'textSecondary', bd: 'neutralBorder' },
  };
  const t = map[tone];
  const fg = colors[t.fg];

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 5,
          height: 24,
          paddingHorizontal: 10,
          borderRadius: radii.xs,
          borderWidth: 1,
          borderColor: colors[t.bd],
          backgroundColor: colors[t.bg],
          alignSelf: 'flex-start',
        },
        style,
      ]}
    >
      {dot ? <View style={{ width: 6, height: 6, borderRadius: 99, backgroundColor: fg }} /> : null}
      <Text variant="label" weight="600" color={fg} style={{ letterSpacing: 0.01 * 12 }}>
        {children}
      </Text>
    </View>
  );
}
