/* ============================================================
   TodayScreen — KPI tiles, deliveries-by-hour bars, completed list
   (app/screens.jsx TodayScreen).
   ============================================================ */
import React from 'react';
import { View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import {
  Badge,
  Card,
  CardHeader,
  FeedError,
  HeaderBar,
  KPITile,
  Screen,
  ScrollArea,
  SectionLabel,
  Spacer,
  Stack,
  Text,
} from '@/components/ui';
import type { KpiTone } from '@/components/ui';
import { CompletedOrderCard } from '@/components/order/OrderCard';
import { CountUp } from '@/components/motion';
import { useQueryClient } from '@tanstack/react-query';
import { qk, useCompletedOrders, useCourier, useStats } from '@/api/hooks';
import { USE_MOCK } from '@/api/config';
import type { IconName } from '@/components/Icon';
import { emptyCourier, emptyStats } from '@/data/empty';
import * as fx from '@/data/fixtures';

export default function TodayScreen() {
  const { colors, space } = useTheme();
  const qc = useQueryClient();
  const statsQ = useStats();
  const completedQ = useCompletedOrders();
  const courierQ = useCourier();
  const s = statsQ.data ?? (USE_MOCK ? fx.stats : emptyStats);
  const completed = completedQ.data ?? (USE_MOCK ? fx.completed : []);
  const branch = (courierQ.data ?? (USE_MOCK ? fx.courier : emptyCourier)).branch;
  const feedError = !USE_MOCK && (statsQ.isError || completedQ.isError);
  const onRetry = () => {
    [qk.stats, qk.completed, qk.courier].forEach(
      (queryKey) => void qc.invalidateQueries({ queryKey }),
    );
  };

  const maxN = Math.max(...s.byHour.map((x) => x.n), 1);
  const round = (n: number) => String(Math.round(n));
  type Tile = {
    l: string;
    num?: number;
    text?: string;
    fmt?: (n: number) => string;
    unit?: string;
    icon: IconName;
    tone: KpiTone;
  };
  const tiles: Tile[] = [
    { l: 'Deliveries', num: s.deliveries, fmt: round, icon: 'checkcircle', tone: 'success' },
    { l: 'Earned', num: s.earnings, unit: "so'm", icon: 'wallet', tone: 'primary' },
    { l: 'Cash collected', num: s.cashCollected, unit: "so'm", icon: 'banknote', tone: 'warning' },
    { l: 'Avg delivery', num: s.avgMinutes, unit: 'min', fmt: round, icon: 'clock', tone: 'info' },
    { l: 'Active time', text: s.activeHours, icon: 'history', tone: 'neutral' },
    {
      l: 'Distance',
      num: s.distanceKm,
      unit: 'km',
      fmt: round,
      icon: 'navigation',
      tone: 'primary',
    },
  ];
  const pairs: (typeof tiles)[] = [];
  for (let i = 0; i < tiles.length; i += 2) pairs.push(tiles.slice(i, i + 2));

  return (
    <Screen>
      <HeaderBar>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text variant="h1" weight="700" style={{ letterSpacing: -0.02 * 24 }}>
            Today
          </Text>
          <Spacer />
          <Badge tone="neutral" dot>
            {branch}
          </Badge>
        </View>
      </HeaderBar>

      <ScrollArea tabPad testID="screen-today">
        <Stack gap={space[4]}>
          {feedError ? <FeedError onRetry={onRetry} testID="today-error" /> : null}
          <Stack gap={space[3]}>
            {pairs.map((pair, i) => (
              <View key={i} style={{ flexDirection: 'row', gap: space[3] }}>
                {pair.map((t) => (
                  <KPITile
                    key={t.l}
                    icon={t.icon}
                    tone={t.tone}
                    label={t.l}
                    unit={t.unit}
                    value={
                      t.text != null ? (
                        t.text
                      ) : (
                        <CountUp value={t.num ?? 0} format={t.fmt} duration={900} />
                      )
                    }
                  />
                ))}
                {pair.length === 1 ? <View style={{ flex: 1 }} /> : null}
              </View>
            ))}
          </Stack>

          <Card>
            <CardHeader icon="chart" title="Deliveries by hour" />
            <View style={{ padding: space[4], paddingTop: 0 }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-end',
                  gap: 5,
                  height: 80,
                  paddingTop: space[2],
                }}
              >
                {s.byHour.map((x) => (
                  <View
                    key={x.h}
                    style={{
                      flex: 1,
                      alignItems: 'center',
                      gap: 5,
                      height: '100%',
                      justifyContent: 'flex-end',
                    }}
                  >
                    <View
                      style={{
                        width: '100%',
                        height: `${(x.n / maxN) * 100}%`,
                        minHeight: 3,
                        borderTopLeftRadius: 4,
                        borderTopRightRadius: 4,
                        borderBottomLeftRadius: 2,
                        borderBottomRightRadius: 2,
                        backgroundColor: x.n === 0 ? colors.surfaceInset : colors.primary,
                      }}
                    />
                    <Text mono color="textTertiary" style={{ fontSize: 9 }}>
                      {x.h}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </Card>

          <View>
            <SectionLabel count={`· ${completed.length}`}>Completed today</SectionLabel>
            <Stack>
              {completed.map((o) => (
                <CompletedOrderCard key={o.id} order={o} />
              ))}
            </Stack>
          </View>
        </Stack>
      </ScrollArea>
    </Screen>
  );
}
