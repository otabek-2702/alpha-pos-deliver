/* ============================================================
   OrderDetail — timeline, map + NavSheet handoff, customer, the
   collect-payment flow (Cash/QR/Split → Paid), items, and the
   step action footer. Ported from app/screens.jsx OrderDetail.
   Refund reverts to unpaid ONLY on the server payment.refunded
   event (BACKEND_INTEGRATION.md §8), never optimistically.
   ============================================================ */
import React, { useEffect, useState } from 'react';
import { Linking, Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useTheme } from '@/theme/ThemeProvider';
import { DrawCheck, Ripple, EASE_OUT, useReducedMotion } from '@/components/motion';
import {
  Badge,
  Button,
  Card,
  DetailHeader,
  Divider,
  ListRow,
  Screen,
  ScrollArea,
  SectionLabel,
  Spacer,
  Stack,
  Text,
} from '@/components/ui';
import { Icon } from '@/components/Icon';
import { MapView } from '@/components/order/MapView';
import { NavSheet } from '@/components/order/NavSheet';
import { nextAction, stepBadge } from '@/components/order/logic';
import { CollectSheet } from '@/payments/CollectSheet';
import { CashSheet } from '@/payments/CashSheet';
import { SplitSheet } from '@/payments/SplitSheet';
import { QRPayScreen } from '@/payments/QRPayScreen';
import { useQueryClient } from '@tanstack/react-query';
import { subscribePaymentEvents } from '@/realtime/ws';
import { createPayment, updateOrderStatus } from '@/api/client';
import { qk, useActiveOrders, useRefundPayment } from '@/api/hooks';
import { useAppStore } from '@/store/appStore';
import { useT } from '@/i18n';
import { applyOrderStagePreview } from '@/lib/preview';
import { money, moneySom } from '@/lib/format';
import { STEPS, STEP_LABEL, type OrderPayment, type Step } from '@/api/types';
import * as fx from '@/data/fixtures';

type Flow = null | 'collect' | 'cash' | 'split' | 'qr' | 'qr-split';

export default function OrderDetailScreen() {
  const { colors, space } = useTheme();
  const params = useLocalSearchParams<{ id: string }>();
  const id = Number(params.id);
  const T = useT();
  const orderStage = useAppStore((s) => s.orderStage);
  const addressMode = useAppStore((s) => s.addressMode);
  const qrDemo = useAppStore((s) => s.qrDemo);
  const showPush = useAppStore((s) => s.showPush);
  const qc = useQueryClient();
  const refundM = useRefundPayment();

  const activeRaw = useActiveOrders().data ?? fx.active;
  const order = applyOrderStagePreview(activeRaw, orderStage).find((o) => o.id === id);

  const [step, setStep] = useState<Step>(order?.step ?? 'ASSIGNED');
  const [sheet, setSheet] = useState(false);
  const [pay, setPay] = useState<OrderPayment>(order?.payment ?? 'UNPAID');
  const [flow, setFlow] = useState<Flow>(null);
  const [paidMethod, setPaidMethod] = useState<string | null>(null);
  const [splitCash, setSplitCash] = useState(0);
  const [refunded, setRefunded] = useState(false);
  const [celebrate, setCelebrate] = useState(false);

  // Revert to unpaid only when the server says so (payment.refunded).
  useEffect(() => {
    if (!order) return;
    const ch = subscribePaymentEvents(order.id, (e) => {
      if (e.event === 'payment.refunded') {
        setPay('UNPAID');
        setPaidMethod(null);
        setRefunded(true);
      }
    });
    return () => ch.close();
  }, [order]);

  // Follow the server FORWARD: if the kitchen marks this order READY or another
  // device advances it (refetched via the realtime layer), move the local view
  // forward — never backward, so an in-flight optimistic advance isn't reverted
  // before its POST lands. Payment only ever moves UNPAID→PAID here; refunds go
  // through the payment.refunded WS path above.
  useEffect(() => {
    if (!order) return;
    // Subscribe local view to the server snapshot of this order; forward-only.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStep((prev) => (STEPS.indexOf(order.step) > STEPS.indexOf(prev) ? order.step : prev));
    if (order.payment === 'PAID') setPay('PAID');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.step, order?.payment]);

  if (!order) {
    return (
      <Screen>
        <DetailHeader title="Order" onBack={() => router.back()} backTestID="detail-back" />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text color="textSecondary">Order not found</Text>
        </View>
      </Screen>
    );
  }

  const b = stepBadge(step);
  const act = nextAction(step);
  const hasCoords = !!order.address.coords && addressMode !== 'Text';
  const sharing = step === 'PICKED_UP' || step === 'ON_WAY';
  const idx = STEPS.indexOf(step);

  function handlePaid(method: string) {
    setPay('PAID');
    setPaidMethod(method);
    setFlow(null);
    setRefunded(false);
    showPush({
      icon: 'wallet',
      title: T('payment_received') + ' · #' + order!.id,
      body: money(order!.total) + " so'm · " + (method || ''),
      bg: colors.success,
    });
  }

  function advance() {
    if (!act.next) return;
    const next = act.next;
    setStep(next); // optimistic; server is forward-only + owner-scoped
    if (next === 'DELIVERED') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCelebrate(true);
      setTimeout(() => setCelebrate(false), 1300);
    }
    // Persist the courier step (no-op in mock mode), then refetch the feeds.
    void updateOrderStatus(order!.id, next)
      .then(() => {
        void qc.invalidateQueries({ queryKey: qk.activeOrders });
        if (next === 'DELIVERED') void qc.invalidateQueries({ queryKey: qk.completed });
      })
      .catch(() => {});
  }

  return (
    <Screen>
      <DetailHeader
        title={`Order #${order.id}`}
        subtitle={`Placed ${order.placedAt}${
          order.address.distanceKm != null ? ` · ${order.address.distanceKm} km away` : ''
        }`}
        onBack={() => router.back()}
        backTestID="detail-back"
        right={<MorphBadge tone={b.tone} dot={b.dot} step={step} label={b.label} />}
      />

      <ScrollArea contentStyle={{ paddingBottom: 24 }}>
        <Stack gap={space[4]} testID="screen-order-detail">
          {/* timeline */}
          <Card padded>
            <Timeline step={step} idx={idx} etaReady={order.etaReady} />
          </Card>

          {sharing ? (
            <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
              <SharePill />
            </View>
          ) : null}

          {/* location */}
          <View>
            <SectionLabel icon="pin">Delivery location</SectionLabel>
            <Card>
              {hasCoords ? <MapView order={order} /> : null}
              <View
                style={{
                  flexDirection: 'row',
                  gap: space[3],
                  padding: space[4],
                  alignItems: 'flex-start',
                }}
              >
                <Icon name="pin" size={20} color={colors.error} style={{ marginTop: 1 }} />
                <View style={{ flex: 1 }}>
                  <Text weight="600">{order.address.text}</Text>
                  {order.address.landmark ? (
                    <Text variant="sm" color="textSecondary" style={{ marginTop: 2 }}>
                      {order.address.landmark}
                    </Text>
                  ) : null}
                  {!hasCoords ? (
                    <View
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 }}
                    >
                      <Icon name="info" size={13} color={colors.textTertiary} />
                      <Text variant="sm" color="textTertiary">
                        Text address only — no map pin shared
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>
              <Divider />
              <View style={{ padding: space[3], paddingHorizontal: space[4] }}>
                <View style={{ alignSelf: 'flex-start' }}>
                  <Button
                    variant="primary"
                    size="sm"
                    iconName="navigation"
                    title={hasCoords ? 'Open route' : 'Search address'}
                    onPress={() => setSheet(true)}
                    style={{ width: undefined, paddingHorizontal: space[5] }}
                    testID="detail-open-route"
                  />
                </View>
              </View>
            </Card>
          </View>

          {/* customer */}
          <View>
            <SectionLabel icon="user">Customer</SectionLabel>
            <Card>
              <ListRow
                icon="user"
                tone="primary"
                title={order.customer.name}
                subtitle={order.customer.phone}
                subtitleMono
                right={
                  <Pressable
                    testID="detail-call"
                    onPress={() =>
                      Linking.openURL('tel:' + order.customer.phone.replace(/\s/g, ''))
                    }
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 10,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: colors.successWeak,
                      borderWidth: 1,
                      borderColor: colors.successBorder,
                    }}
                  >
                    <Icon name="phone" size={20} color={colors.successStrong} />
                  </Pressable>
                }
              />
            </Card>
          </View>

          {/* collect payment */}
          <View>
            <SectionLabel icon="banknote">{T('collect_payment')}</SectionLabel>
            <CollectBanner
              paid={pay === 'PAID'}
              paidMethod={paidMethod}
              total={order.total}
              T={T}
            />

            {pay === 'PAID' && paidMethod ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
                <Icon name="receipt" size={14} color={colors.textTertiary} />
                <Text variant="sm" color="textSecondary">
                  {T('fiscal_receipt')}
                </Text>
                <Spacer />
                <Pressable
                  testID="detail-refund"
                  disabled={refundM.isPending}
                  onPress={() => refundM.mutate({ orderId: order.id })}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                    opacity: refundM.isPending ? 0.5 : 1,
                  }}
                >
                  <Icon name="refresh" size={13} color={colors.error} />
                  <Text variant="sm" weight="600" color="error">
                    {refundM.isPending ? T('refunding') : T('refund')}
                  </Text>
                </Pressable>
              </View>
            ) : null}
            {refunded && pay !== 'PAID' ? (
              <View style={{ marginTop: 8 }}>
                <Badge tone="error">{T('refunded')}</Badge>
              </View>
            ) : null}

            {pay === 'UNPAID' ? (
              <>
                <View style={{ flexDirection: 'row', gap: 6, marginTop: 8, marginBottom: 12 }}>
                  <Icon
                    name="info"
                    size={14}
                    color={colors.textTertiary}
                    style={{ marginTop: 2 }}
                  />
                  <Text variant="sm" color="textTertiary" style={{ flex: 1 }}>
                    {T('held_note', { v: money(order.total) })}
                  </Text>
                </View>
                <Button
                  variant="primary"
                  iconName="wallet"
                  title={T('collect_payment')}
                  onPress={() => setFlow('collect')}
                  testID="detail-collect-payment"
                />
              </>
            ) : null}
          </View>

          {/* items */}
          <View>
            <SectionLabel icon="receipt" count={`· ${order.lines.length}`}>
              Items
            </SectionLabel>
            <Card>
              {order.lines.map((l, i) => (
                <View
                  key={i}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: space[3],
                    paddingVertical: 11,
                    paddingHorizontal: space[4],
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                  }}
                >
                  <View
                    style={{
                      minWidth: 28,
                      height: 28,
                      paddingHorizontal: 6,
                      borderRadius: 6,
                      backgroundColor: colors.surfaceInset,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text mono weight="700" variant="sm" color="textSecondary">
                      {l.qty}×
                    </Text>
                  </View>
                  <Text weight="500" style={{ flex: 1 }}>
                    {l.name}
                  </Text>
                  <Text mono variant="sm" color="textSecondary">
                    {money(l.price)}
                  </Text>
                </View>
              ))}
              <View style={{ flexDirection: 'row', alignItems: 'center', padding: space[4] }}>
                <Text weight="700">Total</Text>
                <Spacer />
                <Text mono weight="700" variant="h3">
                  {moneySom(order.total)}
                </Text>
              </View>
            </Card>
          </View>
        </Stack>
      </ScrollArea>

      {/* action footer */}
      <View
        style={{
          paddingHorizontal: space[4],
          paddingTop: space[4],
          paddingBottom: 28,
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          position: 'relative',
        }}
      >
        {celebrate ? <FloatUp text={`+${money(order.fee)} so'm`} /> : null}
        <Button
          variant={act.variant}
          iconName={act.icon}
          title={act.label}
          disabled={act.disabled}
          onPress={advance}
          testID="detail-action"
        />
        {step === 'ASSIGNED' ? (
          <FootHint icon="bell">You&apos;ll get a push when the kitchen marks it ready</FootHint>
        ) : null}
        {step === 'DELIVERED' ? (
          <FootHint icon="checkcircle">Delivery complete · fee +{money(order.fee)}</FootHint>
        ) : null}
      </View>

      {/* delivered celebration */}
      {celebrate ? (
        <View
          testID="celebrate"
          pointerEvents="none"
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 95,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(34,180,110,0.07)',
          }}
        >
          <View style={{ alignItems: 'center', justifyContent: 'center' }}>
            <Ripple color={colors.success} />
            <DrawCheck size={88} stroke={colors.success} pop />
            <Text weight="700" color="successStrong" variant="h3" style={{ marginTop: space[4] }}>
              {b.label}
            </Text>
          </View>
        </View>
      ) : null}

      {/* overlays */}
      {sheet ? <NavSheet order={order} onClose={() => setSheet(false)} /> : null}
      {flow === 'collect' ? (
        <CollectSheet
          order={order}
          T={T}
          onClose={() => setFlow(null)}
          onPick={(m) => setFlow(m === 'qr' ? 'qr' : m === 'cash' ? 'cash' : 'split')}
        />
      ) : null}
      {flow === 'cash' ? (
        <CashSheet
          order={order}
          T={T}
          onClose={() => setFlow(null)}
          onConfirm={() => {
            // Record the cash collection so the server ledger (balance / shift
            // reconciliation) reflects it. No-op in mock mode.
            void createPayment({ order, provider: 'cash', amount: order.total })
              .then(() => {
                void qc.invalidateQueries({ queryKey: qk.balance });
                void qc.invalidateQueries({ queryKey: qk.recon });
              })
              .catch(() => {});
            handlePaid('cash');
          }}
        />
      ) : null}
      {flow === 'split' ? (
        <SplitSheet
          order={order}
          T={T}
          onClose={() => setFlow(null)}
          onContinueQR={(cash) => {
            setSplitCash(cash);
            setFlow('qr-split');
          }}
        />
      ) : null}
      {flow === 'qr' ? (
        <QRPayScreen
          order={order}
          amount={order.total}
          T={T}
          qrResult={qrDemo}
          onBack={() => setFlow(null)}
          onPaid={(m) => handlePaid(m)}
        />
      ) : null}
      {flow === 'qr-split' ? (
        <QRPayScreen
          order={order}
          amount={order.total - splitCash}
          splitCash={splitCash}
          T={T}
          qrResult={qrDemo}
          onBack={() => setFlow('split')}
          onPaid={() => handlePaid('split')}
        />
      ) : null}
    </Screen>
  );
}

function Timeline({ step, idx, etaReady }: { step: Step; idx: number; etaReady: string }) {
  const { colors } = useTheme();
  return (
    <View>
      {STEPS.map((s, i) => {
        const done = i < idx;
        const current = i === idx;
        const sub = s === 'ASSIGNED' ? etaReady : current ? 'In progress now' : done ? 'Done' : '';
        const dotBg = done ? colors.success : current ? colors.primary : colors.surface;
        const dotBorder = done ? colors.success : current ? colors.primary : colors.borderStrong;
        const titleColor = done ? colors.text : current ? colors.primary : colors.textTertiary;
        return (
          <View key={s} style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ alignItems: 'center', width: 24 }}>
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 99,
                  borderWidth: 2,
                  borderColor: dotBorder,
                  backgroundColor: dotBg,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {i <= idx ? <Icon name="check" size={13} weight={2.6} color="#fff" /> : null}
              </View>
              {i < STEPS.length - 1 ? (
                <View
                  style={{
                    width: 2,
                    flex: 1,
                    minHeight: 22,
                    backgroundColor: done ? colors.success : colors.borderStrong,
                  }}
                />
              ) : null}
            </View>
            <View style={{ flex: 1, paddingBottom: 16, paddingTop: 1 }}>
              <Text weight={current ? '700' : '600'} color={titleColor}>
                {STEP_LABEL[s]}
              </Text>
              {sub ? (
                <Text
                  variant="sm"
                  color={current ? 'textSecondary' : 'textTertiary'}
                  style={{ marginTop: 1 }}
                >
                  {sub}
                </Text>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

function CollectBanner({
  paid,
  paidMethod,
  total,
  T,
}: {
  paid: boolean;
  paidMethod: string | null;
  total: number;
  T: ReturnType<typeof useT>;
}) {
  const { colors, radii, space } = useTheme();
  const label = paid
    ? paidMethod
      ? T('payment_received')
      : T('paid_online_full')
    : T('collect_cash_full');
  return (
    <View
      testID="collect-banner"
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: space[3],
        padding: space[4],
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: paid ? colors.successBorder : colors.warningBorder,
        backgroundColor: paid ? colors.successWeak : colors.warningWeak,
      }}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: radii.md,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: paid ? colors.success : colors.warning,
        }}
      >
        <Icon name={paid ? 'checkcircle' : 'banknote'} size={24} color="#fff" />
      </View>
      <View style={{ flex: 1 }}>
        <Text variant="sm" weight="600" color={paid ? 'successStrong' : 'warningStrong'}>
          {label}
        </Text>
        <Text mono weight="700" style={{ fontSize: 20 }}>
          {moneySom(total)}
        </Text>
      </View>
      {paid ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 5,
            height: 24,
            paddingHorizontal: 10,
            borderRadius: radii.xs,
            borderWidth: 1,
            borderColor: colors.successBorder,
            backgroundColor: colors.successWeak,
          }}
        >
          <Icon name="check" size={12} color={colors.successStrong} />
          <Text variant="label" weight="600" color="successStrong">
            {T('paid')}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function SharePill() {
  const { colors } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
        height: 30,
        paddingHorizontal: 12,
        borderRadius: 99,
        backgroundColor: colors.infoWeak,
        borderWidth: 1,
        borderColor: colors.infoBorder,
      }}
    >
      <View style={{ width: 7, height: 7, borderRadius: 99, backgroundColor: colors.info }} />
      <Text variant="label" weight="600" color="infoStrong">
        Sharing live location with cashier
      </Text>
    </View>
  );
}

function FootHint({ icon, children }: { icon: 'bell' | 'checkcircle'; children: React.ReactNode }) {
  const { colors, space } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
        marginTop: space[2],
      }}
    >
      <Icon name={icon} size={13} color={colors.textTertiary} />
      <Text variant="label" color="textTertiary">
        {children}
      </Text>
    </View>
  );
}

/** Status pill that crossfades when `step` changes (motion.css pillMorph). */
function MorphBadge({
  tone,
  dot,
  step,
  label,
}: {
  tone: React.ComponentProps<typeof Badge>['tone'];
  dot: boolean;
  step: Step;
  label: string;
}) {
  const reduce = useReducedMotion();
  const opacity = useSharedValue(1);
  const ty = useSharedValue(0);
  useEffect(() => {
    if (reduce) return;
    opacity.value = 0.3;
    ty.value = -3;
    opacity.value = withTiming(1, { duration: 400, easing: EASE_OUT });
    ty.value = withTiming(0, { duration: 400, easing: EASE_OUT });
  }, [step, reduce, opacity, ty]);
  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: ty.value }],
  }));
  return (
    <Animated.View style={style}>
      <Badge tone={tone} dot={dot}>
        {label}
      </Badge>
    </Animated.View>
  );
}

/** "+fee so'm" floating up over the footer on delivery (motion.css floatUp). */
function FloatUp({ text }: { text: string }) {
  const reduce = useReducedMotion();
  const p = useSharedValue(0);
  useEffect(() => {
    if (reduce) return;
    p.value = withTiming(1, { duration: 1100, easing: EASE_OUT });
  }, [reduce, p]);
  const style = useAnimatedStyle(() => {
    const opacity = p.value < 0.25 ? p.value / 0.25 : 1 - (p.value - 0.25) / 0.75;
    return {
      opacity,
      transform: [{ translateY: 6 + p.value * -40 }, { scale: 0.9 + p.value * 0.1 }],
    };
  });
  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: 'absolute', bottom: 86, left: 0, right: 0, alignItems: 'center' }, style]}
    >
      <Text mono weight="700" color="successStrong">
        {text}
      </Text>
    </Animated.View>
  );
}
