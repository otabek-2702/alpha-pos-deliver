/* ============================================================
   SplitSheet — part cash + part QR (app/payments.jsx SplitSheet).
   Cash stepper (±10 000); the remainder is charged by QR next.
   ============================================================ */
import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Button, Text } from '@/components/ui';
import { Icon, type IconName } from '@/components/Icon';
import { PayShell } from './PayShell';
import type { Translator } from '@/i18n';
import { money } from '@/lib/format';
import type { ActiveOrder } from '@/api/types';

export function SplitSheet({
  order,
  T,
  onClose,
  onContinueQR,
}: {
  order: ActiveOrder;
  T: Translator;
  onClose: () => void;
  onContinueQR: (cash: number) => void;
}) {
  const { colors, space } = useTheme();
  const total = order.total;
  const [cash, setCash] = useState(Math.round(total / 2 / 1000) * 1000);
  const qr = Math.max(0, total - cash);
  const cashPct = total ? (cash / total) * 100 : 0;
  const bump = (d: number) => setCash((c) => Math.max(0, Math.min(total, c + d)));

  return (
    <PayShell
      title={T('split_payment')}
      onClose={onClose}
      testID="split-sheet"
      closeTestID="split-back"
      bodyStyle={{ alignItems: 'center' }}
      foot={
        <Button
          variant="primary"
          iconName="qr"
          title={T('continue_qr', { v: money(qr) })}
          disabled={qr <= 0}
          onPress={() => onContinueQR(cash)}
          testID="split-continue"
        />
      }
    >
      <Text
        variant="label"
        weight="600"
        color="textTertiary"
        style={{ marginTop: 8, letterSpacing: 0.04 * 12, textTransform: 'uppercase' }}
      >
        {T('amount_due')}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
        <Text mono weight="700" style={{ fontSize: 38, letterSpacing: -0.04 * 38 }}>
          {money(total)}
        </Text>
        <Text color="textTertiary" style={{ fontSize: 18 }}>
          {' '}
          so&apos;m
        </Text>
      </View>

      <View
        style={{
          marginTop: 22,
          width: '100%',
          height: 8,
          borderRadius: 99,
          backgroundColor: colors.surfaceInset,
          overflow: 'hidden',
          flexDirection: 'row',
        }}
      >
        <View style={{ width: `${cashPct}%`, backgroundColor: colors.success }} />
        <View style={{ flex: 1, backgroundColor: colors.primary }} />
      </View>

      <View style={{ width: '100%', marginTop: 22, gap: space[3] }}>
        <SplitRow icon="banknote" tone="success" label={T('cash_part')}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space[2] }}>
            <Stepper icon="minus" onPress={() => bump(-10000)} testID="split-cash-minus" />
            <Text
              mono
              weight="700"
              style={{ flex: 1, textAlign: 'center', fontSize: 20 }}
              testID="split-cash-value"
            >
              {money(cash)}
            </Text>
            <Stepper icon="plus" onPress={() => bump(10000)} testID="split-cash-plus" />
          </View>
        </SplitRow>
        <SplitRow icon="qr" tone="primary" label={T('qr_part')}>
          <Text
            mono
            weight="700"
            style={{ textAlign: 'center', fontSize: 20 }}
            testID="split-qr-value"
          >
            {money(qr)}
          </Text>
        </SplitRow>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          <Icon name="info" size={14} color={colors.textTertiary} style={{ marginTop: 2 }} />
          <Text variant="sm" color="textTertiary" style={{ flex: 1 }}>
            {T('split_note')}
          </Text>
        </View>
      </View>
    </PayShell>
  );
}

function SplitRow({
  icon,
  tone,
  label,
  children,
}: {
  icon: IconName;
  tone: 'success' | 'primary';
  label: string;
  children: React.ReactNode;
}) {
  const { colors, radii } = useTheme();
  const chipBg = tone === 'success' ? colors.successWeak : colors.primaryWeak;
  const chipFg = tone === 'success' ? colors.successStrong : colors.primary;
  return (
    <View style={{ gap: 7 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
        <View
          style={{
            width: 20,
            height: 20,
            borderRadius: 5,
            backgroundColor: chipBg,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name={icon} size={12} color={chipFg} />
        </View>
        <Text variant="label" weight="600" color="textSecondary">
          {label}
        </Text>
      </View>
      <View
        style={{
          height: 56,
          paddingHorizontal: 16,
          borderRadius: radii.md,
          backgroundColor: colors.surfaceInset,
          borderWidth: 1,
          borderColor: colors.borderStrong,
          justifyContent: 'center',
        }}
      >
        {children}
      </View>
    </View>
  );
}

function Stepper({
  icon,
  onPress,
  testID,
}: {
  icon: IconName;
  onPress: () => void;
  testID?: string;
}) {
  const { colors, radii } = useTheme();
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      style={{
        width: 34,
        height: 34,
        borderRadius: radii.md,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon name={icon} size={16} color={colors.textSecondary} />
    </Pressable>
  );
}
