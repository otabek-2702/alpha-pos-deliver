/* ============================================================
   BalanceScreen — current balance hero, held-for-unpaid, recent
   activity (app/screens.jsx BalanceScreen). Reached via the Orders
   balance pill (the prototype pointed the pill at the Cash tab; we
   route it to this dedicated Balance screen — see README deltas).
   ============================================================ */
import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/theme/ThemeProvider';
import { Card, DetailHeader, Screen, ScrollArea, SectionLabel, Stack, Text } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { LedRow } from '@/components/LedRow';
import { useBalance } from '@/api/hooks';
import { money, signed } from '@/lib/format';
import * as fx from '@/data/fixtures';

export default function BalanceScreen() {
  const { colors, radii, shadow, space } = useTheme();
  const bal = useBalance().data ?? {
    balance: fx.balance,
    heldTotal: fx.heldTotal,
    held: fx.held,
    ledger: fx.ledger,
  };

  return (
    <Screen>
      <DetailHeader title="Balance" onBack={() => router.back()} backTestID="balance-back" />
      <ScrollArea tabPad testID="screen-balance">
        <Stack gap={space[4]}>
          {/* hero */}
          <View
            style={{
              backgroundColor: colors.ink,
              borderRadius: radii.xl,
              paddingHorizontal: space[5],
              paddingVertical: space[6],
              ...shadow.md,
            }}
          >
            <Text
              variant="label"
              weight="600"
              color="rgba(255,255,255,.55)"
              style={{ letterSpacing: 0.05 * 12, textTransform: 'uppercase' }}
            >
              Current balance
            </Text>
            <Text
              testID="balance-value"
              mono
              weight="700"
              color={bal.balance < 0 ? '#FF9B8A' : colors.inkFg}
              style={{ fontSize: 40, lineHeight: 42, letterSpacing: -0.04 * 40, marginTop: 6 }}
            >
              {signed(bal.balance)}
            </Text>
            <View
              style={{
                flexDirection: 'row',
                gap: 7,
                marginTop: space[3],
                alignItems: 'flex-start',
              }}
            >
              <Icon name="info" size={15} color="rgba(255,255,255,.8)" style={{ marginTop: 2 }} />
              <Text variant="sm" color="rgba(255,255,255,.7)" style={{ flex: 1 }}>
                Unpaid orders you&apos;re carrying are held against your balance. It clears when the
                cashier marks them paid or cancelled.
              </Text>
            </View>
          </View>

          {/* held */}
          <View>
            <SectionLabel icon="banknote" count={`· ${money(bal.heldTotal)} so'm`}>
              Held for unpaid
            </SectionLabel>
            <Card>
              {bal.held.map((o, i) => (
                <LedRow
                  key={o.id}
                  icon="receipt"
                  dir="down"
                  title={`Order #${o.id} · ${o.customer.name}`}
                  at={`Assigned ${o.placedAt} · unpaid`}
                  amount={`−${money(o.total)}`}
                  amountDir="down"
                  last={i === bal.held.length - 1}
                />
              ))}
            </Card>
          </View>

          {/* recent activity */}
          <View>
            <SectionLabel icon="history">Recent activity</SectionLabel>
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
    </Screen>
  );
}
