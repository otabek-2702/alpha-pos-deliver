/* ============================================================
   ListRow — .lrow / .lrow__icon (toned) / main / right, from
   mobile.css. Used for customer, profile and settings rows.
   ============================================================ */
import React from 'react';
import { Pressable, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import type { ColorTokens } from '@/theme/tokens';
import { Icon, type IconName } from '@/components/Icon';
import { Text } from './Text';

export type RowTone = 'neutral' | 'primary' | 'success' | 'warning' | 'error' | 'info';

const TONE: Record<RowTone, { bg: keyof ColorTokens; fg: keyof ColorTokens }> = {
  neutral: { bg: 'surfaceInset', fg: 'textSecondary' },
  primary: { bg: 'primaryWeak', fg: 'primary' },
  success: { bg: 'successWeak', fg: 'success' },
  warning: { bg: 'warningWeak', fg: 'warning' },
  error: { bg: 'errorWeak', fg: 'error' },
  info: { bg: 'infoWeak', fg: 'info' },
};

export function ListRow({
  icon,
  tone = 'neutral',
  title,
  subtitle,
  subtitleMono = false,
  right,
  onPress,
  testID,
}: {
  icon: IconName;
  tone?: RowTone;
  title: string;
  subtitle?: string;
  subtitleMono?: boolean;
  right?: React.ReactNode;
  onPress?: () => void;
  testID?: string;
}) {
  const { colors, radii, space } = useTheme();
  const t = TONE[tone];
  const Container = onPress ? Pressable : View;

  return (
    <Container
      testID={testID}
      onPress={onPress}
      style={{ flexDirection: 'row', alignItems: 'center', gap: space[3], padding: space[4] }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: radii.md,
          backgroundColor: colors[t.bg],
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name={icon} size={20} color={colors[t.fg]} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text weight="600">{title}</Text>
        {subtitle ? (
          <Text variant="sm" color="textSecondary" mono={subtitleMono} style={{ marginTop: 1 }}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right}
    </Container>
  );
}
