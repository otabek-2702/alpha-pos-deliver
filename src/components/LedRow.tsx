/* ============================================================
   LedRow — .led-row from mobile.css. Shared by Cash + Balance for
   held-for-unpaid and the activity ledger.
   ============================================================ */
import React from 'react';
import { View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Icon, type IconName } from '@/components/Icon';
import { Text } from '@/components/ui';

export function LedRow({
  icon,
  dir,
  title,
  at,
  amount,
  amountDir,
  last = false,
}: {
  icon: IconName;
  dir: 'up' | 'down';
  title: string;
  at: string;
  amount: string;
  amountDir: 'up' | 'down';
  last?: boolean;
}) {
  const { colors, space } = useTheme();
  const iconBg = dir === 'up' ? colors.successWeak : colors.errorWeak;
  const iconFg = dir === 'up' ? colors.success : colors.error;
  const amtColor = amountDir === 'up' ? colors.successStrong : colors.error;
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: space[3],
        paddingVertical: 13,
        paddingHorizontal: space[4],
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: colors.border,
      }}
    >
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 99,
          backgroundColor: iconBg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name={icon} size={dir === 'down' && icon === 'receipt' ? 16 : 15} color={iconFg} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text variant="sm" weight="500">
          {title}
        </Text>
        <Text variant="label" mono color="textTertiary" style={{ marginTop: 1 }}>
          {at}
        </Text>
      </View>
      <Text mono weight="700" variant="body" style={{ color: amtColor }}>
        {amount}
      </Text>
    </View>
  );
}
