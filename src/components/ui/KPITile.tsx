/* ============================================================
   KPITile — .ktile from mobile.css (Today screen tiles).
   ============================================================ */
import React from 'react';
import { View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import type { ColorTokens } from '@/theme/tokens';
import { Icon, type IconName } from '@/components/Icon';
import { Text } from './Text';

export type KpiTone = 'primary' | 'success' | 'warning' | 'info' | 'neutral';

const TONE: Record<KpiTone, { bg: keyof ColorTokens; fg: keyof ColorTokens }> = {
  primary: { bg: 'primaryWeak', fg: 'primary' },
  success: { bg: 'successWeak', fg: 'success' },
  warning: { bg: 'warningWeak', fg: 'warning' },
  info: { bg: 'infoWeak', fg: 'info' },
  neutral: { bg: 'neutralWeak', fg: 'textSecondary' },
};

export function KPITile({
  icon,
  tone,
  label,
  value,
  unit,
}: {
  icon: IconName;
  tone: KpiTone;
  label: string;
  value: React.ReactNode;
  unit?: string;
}) {
  const { colors, radii, shadow, space } = useTheme();
  const t = TONE[tone];
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radii.lg,
        padding: space[4],
        ...shadow.xs,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: space[2],
          marginBottom: space[3],
        }}
      >
        <View
          style={{
            width: 34,
            height: 34,
            borderRadius: radii.sm,
            backgroundColor: colors[t.bg],
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name={icon} size={18} color={colors[t.fg]} />
        </View>
        <Text variant="sm" weight="500" color="textSecondary" style={{ flex: 1 }}>
          {label}
        </Text>
      </View>
      <Text mono weight="700" style={{ fontSize: 26, letterSpacing: -0.03 * 26 }}>
        {value}
        {unit ? (
          <Text variant="sm" color="textTertiary" weight="500">
            {' '}
            {unit}
          </Text>
        ) : null}
      </Text>
    </View>
  );
}
