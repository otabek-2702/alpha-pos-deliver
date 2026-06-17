/* ============================================================
   QRPayScreen — full-screen dynamic QR with a live
   "Waiting for payment…" → "Paid ✓" driven EXCLUSIVELY by the
   server `payment.paid` WS event (BACKEND_INTEGRATION.md §1/§4).
   The prototype's simulated setTimeout is replaced by a real
   subscribePaymentEvents() channel (mock emitter stands in for the
   webhook→WS path when there is no backend). Cash fallback is the
   only courier-driven path and never claims a card/QR success.
   ============================================================ */
import React, { useEffect, useState } from 'react';
import { Animated, Easing, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Button, Text } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { PayShell } from './PayShell';
import { QrCard } from './QrCard';
import { PaidView } from './PaidView';
import { subscribePaymentEvents } from '@/realtime/ws';
import { createPayment } from '@/api/client';
import { payLink } from '@/lib/qr';
import type { Translator } from '@/i18n';
import { money } from '@/lib/format';
import * as fx from '@/data/fixtures';
import type { ActiveOrder } from '@/api/types';

export function QRPayScreen({
  order,
  amount,
  T,
  qrResult,
  splitCash,
  onBack,
  onPaid,
}: {
  order: ActiveOrder;
  amount: number;
  T: Translator;
  qrResult: 'Auto-pay' | 'Waiting';
  splitCash?: number;
  onBack: () => void;
  onPaid: (method: string) => void;
}) {
  const { colors, space } = useTheme();
  const [status, setStatus] = useState<'waiting' | 'paid'>('waiting');
  const [method, setMethod] = useState<string | null>(null);
  const [payload, setPayload] = useState(() => payLink(order, 'payme'));

  // create_payment → render the REAL pay-link the backend returns in the QR.
  useEffect(() => {
    let alive = true;
    createPayment({ order, provider: 'payme', amount })
      .then((res) => {
        if (alive && res.link) setPayload(res.link);
      })
      .catch(() => {
        /* keep the local fallback link */
      });
    return () => {
      alive = false;
    };
  }, [order, amount]);

  // Subscribe to the server payment event. paid arrives ONLY here.
  useEffect(() => {
    if (status !== 'waiting') return;
    const channel = subscribePaymentEvents(
      order.id,
      (e) => {
        if (e.event === 'payment.paid') {
          setMethod(e.data.method ?? e.data.provider ?? 'Card');
          setStatus('paid');
        }
      },
      { autoPay: qrResult !== 'Waiting', amount },
    );
    return () => channel.close();
  }, [order.id, qrResult, amount, status]);

  function settleCash() {
    setMethod(T('cash'));
    setStatus('paid');
  }

  if (status === 'paid') {
    return (
      <PaidView
        amount={amount}
        method={method}
        order={order}
        splitCash={splitCash}
        T={T}
        onDone={() => onPaid(method ?? '')}
      />
    );
  }

  return (
    <PayShell
      title={T('collect_payment')}
      onClose={onBack}
      testID="qr-pay-screen"
      closeTestID="qr-back"
      foot={
        <Button
          variant="success"
          size="sm"
          iconName="banknote"
          title={T('mark_paid_cash')}
          onPress={settleCash}
          testID="qr-paid-cash"
        />
      }
    >
      <Text
        variant="label"
        weight="600"
        color="textTertiary"
        style={{ letterSpacing: 0.04 * 12, textTransform: 'uppercase' }}
      >
        {T('amount_due')}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
        <Text mono weight="700" style={{ fontSize: 38, letterSpacing: -0.04 * 38 }}>
          {money(amount)}
        </Text>
        <Text color="textTertiary" style={{ fontSize: 18 }}>
          {' '}
          so&apos;m
        </Text>
      </View>
      <Text variant="sm" color="textSecondary" style={{ marginTop: 2 }}>
        #{order.id} · {order.customer.name}
        {splitCash ? ` · +${money(splitCash)} ${T('cash')}` : ''}
      </Text>

      <QrCard payload={payload} />

      <Text weight="700" style={{ fontSize: 19, marginTop: space[5] }}>
        {T('scan_to_pay')}
      </Text>

      <View
        style={{
          flexDirection: 'row',
          gap: space[2],
          marginTop: space[4],
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        {fx.providers.map((p) => (
          <View
            key={p.key}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 7,
              height: 34,
              paddingLeft: 8,
              paddingRight: 13,
              borderRadius: 99,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View
              style={{
                width: 20,
                height: 20,
                borderRadius: 6,
                backgroundColor: p.bg,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text weight="700" color={p.fg} style={{ fontSize: 11 }}>
                {p.mark}
              </Text>
            </View>
            <Text variant="sm" weight="600" color="textSecondary">
              {p.name}
            </Text>
          </View>
        ))}
      </View>

      <View
        testID="qr-waiting"
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 9,
          marginTop: space[5],
          paddingVertical: 9,
          paddingHorizontal: 16,
          borderRadius: 99,
          backgroundColor: colors.infoWeak,
          borderWidth: 1,
          borderColor: colors.infoBorder,
        }}
      >
        <Spinner color={colors.infoStrong} />
        <Text variant="sm" weight="600" color="infoStrong">
          {T('waiting_payment')}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: space[2] }}>
        <Icon name="shield" size={12} color={colors.success} />
        <Text variant="label" color="textTertiary" style={{ flexShrink: 1 }}>
          {T('secure_note')}
        </Text>
      </View>
    </PayShell>
  );
}

function Spinner({ color }: { color: string }) {
  const [spin] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 800,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [spin]);
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  return (
    <Animated.View
      style={{
        width: 15,
        height: 15,
        borderRadius: 99,
        borderWidth: 2,
        borderColor: color,
        borderTopColor: 'transparent',
        transform: [{ rotate }],
      }}
    />
  );
}
