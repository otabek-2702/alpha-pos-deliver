/* ============================================================
   CashSheet — cash received keypad + change/short banner
   (app/payments.jsx CashSheet). Full-screen .pay overlay.
   ============================================================ */
import React, { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useTheme } from '@/theme/ThemeProvider';
import { Button, Text } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { EASE_OUT, useReducedMotion } from '@/components/motion';
import { PayShell } from './PayShell';
import type { Translator } from '@/i18n';
import { money, moneySom } from '@/lib/format';
import type { ActiveOrder } from '@/api/types';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '000', '0', 'del'];

export function CashSheet({
  order,
  T,
  onClose,
  onConfirm,
}: {
  order: ActiveOrder;
  T: Translator;
  onClose: () => void;
  onConfirm: (value: number) => void;
}) {
  const { colors, radii, space } = useTheme();
  const due = order.total;
  const [entered, setEntered] = useState('');
  const val = parseInt(entered || '0', 10);
  const diff = val - due;

  const presets = Array.from(
    new Set([due, Math.ceil(due / 50000) * 50000, Math.ceil(due / 100000) * 100000]),
  ).filter((p) => p > 0);

  function press(d: string) {
    if (d === 'del') return setEntered((e) => e.slice(0, -1));
    if (d === '000') return setEntered((e) => (e === '' ? e : (e + '000').slice(0, 9)));
    setEntered((e) => (e + d).replace(/^0+/, '').slice(0, 9));
  }

  return (
    <PayShell
      title={T('cash_received')}
      onClose={onClose}
      testID="cash-sheet"
      closeTestID="cash-back"
      foot={
        <Button
          variant="success"
          iconName="checkcircle"
          title={T('confirm_cash')}
          disabled={val < due}
          onPress={() => onConfirm(val)}
          testID="cash-confirm"
        />
      }
    >
      <Text
        variant="label"
        weight="600"
        color="textTertiary"
        style={{ letterSpacing: 0.04 * 12, textTransform: 'uppercase' }}
      >
        {T('amount_to_collect')}
      </Text>
      <Text mono color="textSecondary" style={{ fontSize: 15, marginTop: 2 }}>
        #{order.id} · {moneySom(due)}
      </Text>

      <View style={{ marginTop: space[4], flexDirection: 'row', alignItems: 'baseline' }}>
        <Text mono weight="700" style={{ fontSize: 40, letterSpacing: -0.04 * 40 }}>
          {val ? money(val) : '0'}
        </Text>
        <Text color="textTertiary" weight="500" style={{ fontSize: 18 }}>
          {' '}
          so&apos;m
        </Text>
      </View>

      <View
        style={{
          flexDirection: 'row',
          gap: space[2],
          flexWrap: 'wrap',
          justifyContent: 'center',
          marginTop: space[4],
        }}
      >
        <Chip
          label={T('exact')}
          on={val === due}
          onPress={() => setEntered(String(due))}
          testID="cash-exact"
        />
        {presets.map((p) => (
          <Chip key={p} label={money(p)} on={val === p} onPress={() => setEntered(String(p))} />
        ))}
      </View>

      {val > 0 ? (
        <View
          testID="cash-change-banner"
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            padding: space[4],
            borderRadius: radii.lg,
            marginTop: space[4],
            backgroundColor: diff >= 0 ? colors.successWeak : colors.errorWeak,
            borderWidth: 1,
            borderColor: diff >= 0 ? colors.successBorder : colors.errorBorder,
          }}
        >
          <Text variant="sm" weight="600" color={diff >= 0 ? 'successStrong' : 'errorStrong'}>
            {diff >= 0 ? T('change_due', { v: '' }).replace(/\s*$/, '') : T('amount_to_collect')}
          </Text>
          <ChangeValue value={Math.abs(diff)} />
        </View>
      ) : null}

      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 10,
          width: '100%',
          marginTop: space[5],
        }}
      >
        {KEYS.map((k) => {
          const fn = k === 'del' || k === '000';
          return (
            <Pressable
              key={k}
              testID={`cash-key-${k}`}
              onPress={() => press(k)}
              style={({ pressed }) => ({
                width: '31.5%',
                height: 56,
                borderRadius: radii.md,
                backgroundColor: pressed ? colors.surface2 : colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                alignItems: 'center',
                justifyContent: 'center',
              })}
            >
              {k === 'del' ? (
                <Icon name="delete" size={20} color={colors.textSecondary} />
              ) : (
                <Text
                  mono={!fn}
                  weight={fn ? '500' : '700'}
                  color={fn ? 'textSecondary' : 'text'}
                  style={{ fontSize: fn ? 15 : 22 }}
                >
                  {k}
                </Text>
              )}
            </Pressable>
          );
        })}
      </View>
    </PayShell>
  );
}

function Chip({
  label,
  on,
  onPress,
  testID,
}: {
  label: string;
  on: boolean;
  onPress: () => void;
  testID?: string;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      style={{
        height: 38,
        paddingHorizontal: 15,
        borderRadius: 99,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: on ? colors.primaryWeak : colors.surfaceInset,
        borderWidth: 1,
        borderColor: on ? colors.primaryBorder : colors.border,
      }}
    >
      <Text mono weight="600" variant="sm" color={on ? 'primary' : 'text'}>
        {label}
      </Text>
    </Pressable>
  );
}

/** Change/short amount that re-tweens (scale 1.12→1 + fade) on change. */
function ChangeValue({ value }: { value: number }) {
  const reduce = useReducedMotion();
  const s = useSharedValue(1);
  const o = useSharedValue(1);
  useEffect(() => {
    if (reduce) return;
    s.value = 1.12;
    o.value = 0.6;
    s.value = withTiming(1, { duration: 300, easing: EASE_OUT });
    o.value = withTiming(1, { duration: 300, easing: EASE_OUT });
  }, [value, reduce, s, o]);
  const style = useAnimatedStyle(() => ({ opacity: o.value, transform: [{ scale: s.value }] }));
  return (
    <Animated.View style={style}>
      <Text mono weight="700" style={{ fontSize: 22 }}>
        {money(value)}
      </Text>
    </Animated.View>
  );
}
