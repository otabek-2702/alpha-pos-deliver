/* ============================================================
   CashScreen — cash & earnings + shift reconciliation, settle /
   handover-code sheet, breakdown, held-for-unpaid, activity.
   Ported from app/screens.jsx CashScreen.
   ============================================================ */
import React, { useState } from 'react';
import { View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/theme/ThemeProvider';
import { Odometer, RollDigits } from '@/components/motion';
import {
  Badge,
  Button,
  Card,
  CardHeader,
  HeaderBar,
  Screen,
  ScrollArea,
  SectionLabel,
  Sheet,
  Spacer,
  Stack,
  Text,
} from '@/components/ui';
import { Icon, type IconName } from '@/components/Icon';
import { LedRow } from '@/components/LedRow';
import { useBalance, useReconciliation } from '@/api/hooks';
import { useT } from '@/i18n';
import { money, signed } from '@/lib/format';
import * as fx from '@/data/fixtures';

export default function CashScreen() {
  const { colors, radii, space } = useTheme();
  const T = useT();
  const r = useReconciliation().data ?? fx.recon;
  const bal = useBalance().data ?? { heldTotal: fx.heldTotal, held: fx.held, ledger: fx.ledger };
  const [handover, setHandover] = useState(false);
  const [settled, setSettled] = useState(false);
  const [cashNow, setCashNow] = useState(r.cashInHand);
  const totalCollected = r.collectedCash + r.qrCollected;

  return (
    <Screen>
      <HeaderBar>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text variant="h1" weight="700" style={{ letterSpacing: -0.02 * 24 }}>
            {T('cash_title')}
          </Text>
          <Spacer />
          <Badge tone="neutral" dot>
            {T('shift_started', { v: r.shiftStart })}
          </Badge>
        </View>
      </HeaderBar>

      <ScrollArea tabPad testID="screen-cash">
        <Stack gap={space[4]}>
          {/* recon hero */}
          <View
            style={{
              borderRadius: radii.lg,
              overflow: 'hidden',
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.border,
              gap: 1,
            }}
          >
            <ReconCell
              accent
              wide
              icon="banknote"
              label={T('cash_in_hand')}
              unit="so'm"
              valueNode={<Odometer value={cashNow} fontSize={24} color={colors.inkFg} />}
            />
            <View style={{ flexDirection: 'row', gap: 1 }}>
              <ReconCell icon="card" label={T('card_qr_collected')} value={money(r.qrCollected)} />
              <ReconCell icon="wallet" label={T('your_payout')} value={money(r.netPayout)} />
            </View>
          </View>

          {/* reconciliation */}
          <Card>
            <CardHeader icon="receipt" title={T('reconciliation')} />
            <View style={{ paddingHorizontal: space[4] }}>
              <ReconRow l={T('total_collected')} v={totalCollected} />
              <ReconRow l={T('hand_in_cash')} v={r.cashInHand} strong />
              <ReconRow l={T('net_payout')} v={r.netPayout} pos last />
            </View>
            <View style={{ padding: space[4] }}>
              {settled ? (
                <View
                  style={{
                    height: 44,
                    borderRadius: radii.xs,
                    borderWidth: 1,
                    borderColor: colors.successBorder,
                    backgroundColor: colors.successWeak,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                  testID="cash-settled"
                >
                  <Icon name="checkcircle" size={16} color={colors.successStrong} />
                  <Text variant="label" weight="600" color="successStrong">
                    {T('settled')}
                  </Text>
                </View>
              ) : (
                <Button
                  variant="dark"
                  iconName="bank"
                  title={T('settle_shift')}
                  onPress={() => setHandover(true)}
                  testID="cash-settle"
                />
              )}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 5,
                  marginTop: 10,
                }}
              >
                <Icon name="info" size={13} color={colors.textTertiary} />
                <Text
                  variant="label"
                  color="textTertiary"
                  style={{ flexShrink: 1, textAlign: 'center' }}
                >
                  {T('settle_note')}
                </Text>
              </View>
            </View>
          </Card>

          {/* breakdown */}
          <View>
            <SectionLabel icon="coins">{T('breakdown')}</SectionLabel>
            <Card>
              <BreakRow icon="navigation" t={T('fees')} v={r.deliveryFees} />
              <Divider />
              <BreakRow icon="star" t={T('bonuses')} v={r.bonuses} />
              <Divider />
              <BreakRow icon="gift" t={T('tips')} v={r.tips} last />
            </Card>
          </View>

          {/* held for unpaid */}
          <View>
            <SectionLabel icon="banknote" count={`· ${money(bal.heldTotal)} so'm`}>
              {T('held_for_unpaid')}
            </SectionLabel>
            <Card>
              {bal.held.map((o, i) => (
                <LedRow
                  key={o.id}
                  icon="receipt"
                  dir="down"
                  title={`Order #${o.id} · ${o.customer.name}`}
                  at={`${o.placedAt} · ${T('unpaid')}`}
                  amount={`−${money(o.total)}`}
                  amountDir="down"
                  last={i === bal.held.length - 1}
                />
              ))}
            </Card>
          </View>

          {/* recent activity */}
          <View>
            <SectionLabel icon="history">{T('recent_activity')}</SectionLabel>
            <Card>
              {bal.ledger.map((e, i) => (
                <LedRow
                  key={i}
                  icon={e.amount >= 0 ? 'arrowup' : 'arrowdown'}
                  dir={e.amount >= 0 ? 'up' : 'down'}
                  title={e.label}
                  at={e.at}
                  amount={signed(e.amount)}
                  amountDir={e.amount >= 0 ? 'up' : 'down'}
                  last={i === bal.ledger.length - 1}
                />
              ))}
            </Card>
          </View>
        </Stack>
      </ScrollArea>

      {handover ? (
        <Sheet
          testID="handover-sheet"
          title={T('handover_title')}
          subtitle={T('handover_sub')}
          onClose={() => setHandover(false)}
        >
          <Stack gap={space[4]} style={{ marginTop: 4 }}>
            <View>
              <SectionLabel style={{ justifyContent: 'center', marginBottom: 8 }}>
                {T('handover_code_l')}
              </SectionLabel>
              <View
                style={{
                  borderWidth: 2,
                  borderStyle: 'dashed',
                  borderColor: colors.borderStrong,
                  borderRadius: radii.lg,
                  backgroundColor: colors.surfaceInset,
                  padding: space[4],
                }}
              >
                <View testID="handover-code">
                  <RollDigits text={r.handoverCode} fontSize={30} color={colors.text} />
                </View>
              </View>
            </View>
            <View
              style={{
                flexDirection: 'row',
                gap: 1,
                borderRadius: radii.lg,
                overflow: 'hidden',
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.border,
              }}
            >
              <ReconCell label={T('hand_in_cash')} value={money(r.cashInHand)} unit="so'm" />
              <ReconCell label={T('net_payout')} value={money(r.netPayout)} />
            </View>
            <Button
              variant="primary"
              iconName="check"
              title={T('confirm_settle')}
              onPress={() => {
                setSettled(true);
                setHandover(false);
                setCashNow(0);
                void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }}
              testID="handover-confirm"
            />
          </Stack>
        </Sheet>
      ) : null}
    </Screen>
  );
}

function ReconCell({
  accent = false,
  wide = false,
  icon,
  label,
  value,
  valueNode,
  unit,
}: {
  accent?: boolean;
  wide?: boolean;
  icon?: IconName;
  label: string;
  value?: string;
  valueNode?: React.ReactNode;
  unit?: string;
}) {
  const { colors, space } = useTheme();
  return (
    <View
      style={{
        flex: wide ? undefined : 1,
        width: wide ? '100%' : undefined,
        backgroundColor: accent ? colors.ink : colors.surface,
        padding: space[4],
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        {icon ? (
          <Icon
            name={icon}
            size={13}
            color={accent ? 'rgba(255,255,255,.6)' : colors.textSecondary}
          />
        ) : null}
        <Text variant="sm" weight="500" color={accent ? 'rgba(255,255,255,.6)' : 'textSecondary'}>
          {label}
        </Text>
      </View>
      {valueNode ? (
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginTop: 4 }}>
          {valueNode}
          {unit ? (
            <Text
              style={{ fontSize: 13, color: accent ? 'rgba(255,255,255,.6)' : colors.textTertiary }}
            >
              {' '}
              {unit}
            </Text>
          ) : null}
        </View>
      ) : (
        <Text
          mono
          weight="700"
          style={{
            fontSize: 24,
            letterSpacing: -0.03 * 24,
            marginTop: 4,
            color: accent ? colors.inkFg : colors.text,
          }}
        >
          {value}
          {unit ? (
            <Text
              style={{ fontSize: 13, color: accent ? 'rgba(255,255,255,.6)' : colors.textTertiary }}
            >
              {' '}
              {unit}
            </Text>
          ) : null}
        </Text>
      )}
    </View>
  );
}

function ReconRow({
  l,
  v,
  strong,
  pos,
  last,
}: {
  l: string;
  v: number;
  strong?: boolean;
  pos?: boolean;
  last?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 11,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: colors.border,
      }}
    >
      <Text variant="sm" weight={strong ? '700' : '500'} color="textSecondary">
        {l}
      </Text>
      <Spacer />
      <Text mono weight="700" style={{ color: pos ? colors.successStrong : colors.text }}>
        {pos ? '+' : ''}
        {money(v)}
        <Text style={{ fontSize: 12, color: colors.textTertiary }}> so&apos;m</Text>
      </Text>
    </View>
  );
}

function BreakRow({ icon, t, v, last }: { icon: IconName; t: string; v: number; last?: boolean }) {
  const { colors, space } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: space[3],
        paddingVertical: 13,
        paddingHorizontal: space[4],
        borderBottomWidth: last ? 0 : 0,
      }}
    >
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 99,
          backgroundColor: colors.successWeak,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name={icon} size={15} color={colors.success} />
      </View>
      <Text variant="sm" weight="500" style={{ flex: 1 }}>
        {t}
      </Text>
      <Text mono weight="700" style={{ color: colors.successStrong }}>
        +{money(v)}
      </Text>
    </View>
  );
}

function Divider() {
  const { colors } = useTheme();
  return <View style={{ height: 1, backgroundColor: colors.border }} />;
}
