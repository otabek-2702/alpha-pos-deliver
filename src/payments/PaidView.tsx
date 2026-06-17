/* ============================================================
   PaidView — payment success (payments.jsx PaidView) + motion:
   burst pops, DrawCheck self-draws (success-strong), white ripple
   expands, "Payment received" + rows slide up (enterUp). Success
   haptic on mount. Auto-returns after 4.2s or on Done.
   ============================================================ */
import React, { useEffect } from 'react';
import { View } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@/theme/ThemeProvider';
import { Button, Text } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { DrawCheck, Ripple, useReducedMotion } from '@/components/motion';
import { PayShell } from './PayShell';
import type { Translator } from '@/i18n';
import { money } from '@/lib/format';
import type { ActiveOrder } from '@/api/types';

export function PaidView({
  amount,
  method,
  order,
  splitCash,
  T,
  onDone,
}: {
  amount: number;
  method: string | null;
  order: ActiveOrder;
  splitCash?: number;
  T: Translator;
  onDone: () => void;
}) {
  const { colors, radii, space } = useTheme();
  const reduce = useReducedMotion();
  const grand = amount + (splitCash ?? 0);

  useEffect(() => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const t = setTimeout(onDone, 4200);
    return () => clearTimeout(t);
  }, [onDone]);

  const enter = (delay: number) => (reduce ? undefined : FadeInDown.duration(400).delay(delay));

  return (
    <PayShell
      paid
      onClose={onDone}
      closeIcon="close"
      closeRight
      closeTestID="paid-close"
      testID="paid-view"
      bodyStyle={{ alignItems: 'center' }}
      foot={
        <Button
          variant="secondary"
          iconName="check"
          title={T('done')}
          textColor={colors.successStrong}
          style={{ backgroundColor: '#fff', borderColor: '#fff' }}
          onPress={onDone}
          testID="paid-done"
        />
      }
    >
      <View
        style={{
          width: 96,
          height: 96,
          borderRadius: 99,
          backgroundColor: '#fff',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 40,
          marginBottom: space[5],
          position: 'relative',
        }}
      >
        {!reduce ? <Ripple color="#fff" size={96} /> : null}
        <DrawCheck size={58} stroke={colors.successStrong} pop />
      </View>

      <Animated.Text entering={enter(60)}>
        <Text
          testID="qr-paid-badge"
          weight="700"
          color="rgba(255,255,255,.85)"
          style={{ letterSpacing: 0.03 * 13, textTransform: 'uppercase', fontSize: 13 }}
        >
          {T('payment_received')}
        </Text>
      </Animated.Text>
      <Animated.View entering={enter(120)}>
        <Text mono weight="700" color="#fff" style={{ fontSize: 40, letterSpacing: -0.04 * 40 }}>
          {money(grand)} so&apos;m
        </Text>
      </Animated.View>
      <Animated.View
        entering={enter(180)}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: space[2] }}
      >
        <Icon name="checkcircle" size={18} color="rgba(255,255,255,.85)" />
        <Text color="rgba(255,255,255,.85)" variant="body">
          {T('paid_via', { m: method ?? '—' })}
        </Text>
      </Animated.View>

      <Animated.View
        entering={enter(240)}
        style={{
          backgroundColor: 'rgba(255,255,255,.12)',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,.18)',
          borderRadius: radii.lg,
          padding: space[4],
          marginTop: space[5],
          width: '100%',
          maxWidth: 300,
          gap: 2,
        }}
      >
        <ReceiptRow label={T('amount_due')} value={money(amount)} />
        {splitCash ? <ReceiptRow label={T('cash_part')} value={money(splitCash)} /> : null}
        <ReceiptRow label={`#${order.id}`} value={method ?? '—'} />
        <ReceiptRow label={T('fiscal_receipt')} value="✓" />
      </Animated.View>
    </PayShell>
  );
}

function ReceiptRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 }}>
      <Text variant="sm" color="rgba(255,255,255,.85)" style={{ flexShrink: 1 }}>
        {label}
      </Text>
      <Text variant="sm" mono color="#fff" weight="600">
        {value}
      </Text>
    </View>
  );
}
