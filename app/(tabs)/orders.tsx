/* ============================================================
   OrdersScreen (home) — app/screens.jsx OrdersScreen + motion:
   pull-to-refresh (branded ring → skeletons), reworked balance pill
   ("Cash to hand in" = heldTotal), Odometer quick-stats, daily-goal
   bar. Header + lists unchanged.
   ============================================================ */
import React, { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useTheme } from '@/theme/ThemeProvider';
import { Avatar, FeedError, HeaderBar, Screen, Segmented, Stack, Text } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { ActiveOrderCard, CompletedOrderCard } from '@/components/order/OrderCard';
import { GoalBar, Odometer, PullToRefresh, SkeletonOrderCard } from '@/components/motion';
import {
  qk,
  useActiveOrders,
  useBalance,
  useCompletedOrders,
  useCourier,
  useNotifications,
  useSetOnline,
  useStats,
} from '@/api/hooks';
import { USE_MOCK } from '@/api/config';
import { useAppStore } from '@/store/appStore';
import { applyOrderStagePreview } from '@/lib/preview';
import { money } from '@/lib/format';
import { emptyBalance, emptyCourier, emptyStats } from '@/data/empty';
import * as fx from '@/data/fixtures';

export default function OrdersScreen() {
  const { colors, radii, shadow, space } = useTheme();
  const [tab, setTab] = useState<'active' | 'completed'>('active');
  const online = useAppStore((s) => s.online);
  const setOnline = useAppStore((s) => s.setOnline);
  const orderStage = useAppStore((s) => s.orderStage);
  const qc = useQueryClient();
  const onlineM = useSetOnline();

  const courierQ = useCourier();
  const statsQ = useStats();
  const balanceQ = useBalance();
  const activeQ = useActiveOrders();
  const completedQ = useCompletedOrders();
  const notifQ = useNotifications();

  // Fixtures fall back ONLY in mock mode; in real mode a still-loading or FAILED
  // query shows empty (zeroed) data + a FeedError banner — never fake "live" data.
  const courier = courierQ.data ?? (USE_MOCK ? fx.courier : emptyCourier);
  const stats = statsQ.data ?? (USE_MOCK ? fx.stats : emptyStats);
  const balance =
    balanceQ.data ??
    (USE_MOCK
      ? { balance: fx.balance, heldTotal: fx.heldTotal, held: fx.held, ledger: fx.ledger }
      : emptyBalance);
  const activeRaw = activeQ.data ?? (USE_MOCK ? fx.active : []);
  const completed = completedQ.data ?? (USE_MOCK ? fx.completed : []);
  const unread = (notifQ.data ?? (USE_MOCK ? fx.notifications : [])).filter((n) => n.unread).length;

  const feedError =
    !USE_MOCK &&
    (courierQ.isError ||
      statsQ.isError ||
      balanceQ.isError ||
      activeQ.isError ||
      completedQ.isError);

  // Reflect the server's shift state on load (and after a toggle's refetch).
  useEffect(() => {
    if (!USE_MOCK && courierQ.data) setOnline(courierQ.data.online);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courierQ.data?.online]);

  const toggleOnline = () => {
    const next = !online;
    setOnline(next); // optimistic
    onlineM.mutate(next); // POST /courier/shift/online/ (no-op in mock)
  };

  const onRefresh = () => {
    [qk.activeOrders, qk.completed, qk.balance, qk.stats, qk.notifications, qk.courier].forEach(
      (queryKey) => void qc.invalidateQueries({ queryKey }),
    );
  };

  const active = applyOrderStagePreview(activeRaw, orderStage);
  const pad = { paddingVertical: space[4], paddingHorizontal: space[5], paddingBottom: 108 };

  return (
    <Screen>
      <HeaderBar>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space[3] }}>
          <Pressable testID="orders-avatar" onPress={() => router.navigate('/profile')}>
            <Avatar initials={courier.initials} />
          </Pressable>
          <View>
            <Text variant="sm" color="textSecondary">
              Welcome back
            </Text>
            <Text weight="700" style={{ fontSize: 20, lineHeight: 26, letterSpacing: -0.02 * 20 }}>
              {courier.first} {courier.last}
            </Text>
          </View>
          <View style={{ flex: 1 }} />
          <Pressable
            testID="orders-bell"
            onPress={() => router.push('/notifications')}
            style={({ pressed }) => ({
              width: 42,
              height: 42,
              borderRadius: radii.md,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: pressed ? colors.surface2 : colors.surface,
              alignItems: 'center',
              justifyContent: 'center',
            })}
          >
            <Icon name="bell" size={20} color={colors.textSecondary} />
            {unread > 0 ? (
              <View
                style={{
                  position: 'absolute',
                  top: 9,
                  right: 10,
                  width: 8,
                  height: 8,
                  borderRadius: 99,
                  backgroundColor: colors.error,
                  borderWidth: 2,
                  borderColor: colors.surface,
                }}
              />
            ) : null}
          </Pressable>
        </View>

        <View style={{ flexDirection: 'row', gap: space[3], marginTop: space[5] }}>
          <ShiftToggle online={online} onToggle={toggleOnline} />
        </View>
      </HeaderBar>

      <PullToRefresh
        testID="orders-scroll"
        contentContainerStyle={pad}
        onRefresh={onRefresh}
        renderSkeleton={() => (
          <Stack>
            <SkeletonOrderCard />
            <SkeletonOrderCard />
            <SkeletonOrderCard />
          </Stack>
        )}
      >
        <Stack gap={space[4]}>
          {feedError ? <FeedError onRetry={onRefresh} testID="orders-error" /> : null}
          {/* balance pill → cash to hand in */}
          <Pressable
            testID="orders-balance-pill"
            onPress={() => router.push('/balance')}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: space[3],
              padding: space[4],
              borderRadius: radii.lg,
              backgroundColor: colors.ink,
              transform: [{ scale: pressed ? 0.98 : 1 }],
              ...shadow.md,
            })}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: radii.md,
                backgroundColor: 'rgba(255,255,255,0.12)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="banknote" size={20} color={colors.inkFg} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text
                variant="label"
                weight="600"
                color="rgba(255,255,255,.6)"
                style={{ letterSpacing: 0.04 * 12, textTransform: 'uppercase' }}
              >
                Cash to hand in
              </Text>
              {balance.heldTotal > 0 ? (
                <>
                  <Text
                    testID="orders-balance-value"
                    mono
                    weight="700"
                    color={colors.inkFg}
                    style={{ fontSize: 22, letterSpacing: -0.03 * 22, marginTop: 1 }}
                  >
                    {money(balance.heldTotal)}{' '}
                    <Text
                      style={{ fontSize: 13, fontWeight: '500', color: 'rgba(255,255,255,.55)' }}
                    >
                      so&apos;m
                    </Text>
                  </Text>
                  <Text
                    style={{
                      fontSize: 11,
                      lineHeight: 14,
                      color: 'rgba(255,255,255,.55)',
                      marginTop: 4,
                    }}
                  >
                    Collected from clients · give to the cashier
                  </Text>
                </>
              ) : (
                <Text
                  testID="orders-balance-value"
                  mono
                  weight="700"
                  color="#7BE0A8"
                  style={{ fontSize: 22, marginTop: 1 }}
                >
                  All clear
                </Text>
              )}
            </View>
            <View style={{ opacity: 0.5, alignSelf: 'center' }}>
              <Icon name="chevright" size={20} color={colors.inkFg} />
            </View>
          </Pressable>

          {/* quick stats (rolling odometer) */}
          <View
            style={{
              flexDirection: 'row',
              backgroundColor: colors.border,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: radii.lg,
              overflow: 'hidden',
              gap: 1,
            }}
          >
            <QStat label="Deliveries">
              <Odometer
                value={stats.deliveries}
                format={(n) => String(Math.round(n))}
                fontSize={19}
              />
            </QStat>
            <QStat label="Earned">
              <Odometer value={stats.earnings} delay={80} fontSize={19} />
            </QStat>
            <QStat label="Avg time">
              <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
                <Odometer
                  value={stats.avgMinutes}
                  format={(n) => String(Math.round(n))}
                  delay={160}
                  fontSize={19}
                />
                <Text color="textTertiary" style={{ fontSize: 12 }}>
                  m
                </Text>
              </View>
            </QStat>
          </View>

          {/* daily goal */}
          <View
            style={{
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: radii.lg,
              paddingHorizontal: space[4],
              paddingTop: space[3],
              paddingBottom: space[4],
              ...shadow.xs,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'baseline', marginBottom: 10 }}>
              <Text variant="sm" weight="600" color="textSecondary">
                Daily goal
              </Text>
              <View style={{ flex: 1 }} />
              <Text variant="sm" weight="700" mono>
                {stats.deliveries}/12
              </Text>
            </View>
            <GoalBar value={stats.deliveries} max={12} />
          </View>

          {/* segments */}
          <Segmented
            value={tab}
            onChange={(k) => setTab(k as 'active' | 'completed')}
            testIDPrefix="orders-seg"
            items={[
              { key: 'active', label: 'Active', count: active.length },
              { key: 'completed', label: 'Completed', count: completed.length },
            ]}
          />

          {/* list */}
          <Stack>
            {tab === 'active'
              ? active.map((o) => (
                  <ActiveOrderCard
                    key={o.id}
                    order={o}
                    testID={`order-card-${o.id}`}
                    onPress={() => router.push(`/order/${o.id}`)}
                  />
                ))
              : completed.map((o) => <CompletedOrderCard key={o.id} order={o} />)}
          </Stack>
        </Stack>
      </PullToRefresh>
    </Screen>
  );
}

function ShiftToggle({ online, onToggle }: { online: boolean; onToggle: () => void }) {
  const { colors, space } = useTheme();
  return (
    <Pressable
      testID="orders-shift-toggle"
      onPress={onToggle}
      style={{
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: space[3],
        paddingVertical: 6,
        paddingLeft: space[4],
        paddingRight: 6,
        borderRadius: 999,
        backgroundColor: online ? colors.successWeak : colors.surface,
        borderWidth: 1,
        borderColor: online ? colors.successBorder : colors.border,
      }}
    >
      <View
        style={{
          width: 9,
          height: 9,
          borderRadius: 99,
          backgroundColor: online ? colors.success : colors.textTertiary,
        }}
      />
      <Text variant="sm" weight="600" color={online ? 'successStrong' : 'textSecondary'}>
        {online ? 'On shift · available' : 'Off shift'}
      </Text>
      <View style={{ flex: 1 }} />
      <View
        style={{
          width: 42,
          height: 24,
          borderRadius: 99,
          backgroundColor: online ? colors.success : colors.borderStrong,
          justifyContent: 'center',
        }}
      >
        <View
          style={{
            position: 'absolute',
            left: online ? 20 : 2,
            width: 20,
            height: 20,
            borderRadius: 99,
            backgroundColor: '#fff',
          }}
        />
      </View>
    </Pressable>
  );
}

function QStat({ children, label }: { children: React.ReactNode; label: string }) {
  const { colors, space } = useTheme();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.surface,
        paddingHorizontal: space[3],
        paddingTop: space[3],
        paddingBottom: space[4],
        alignItems: 'center',
      }}
    >
      {children}
      <Text variant="micro" weight="500" color="textTertiary" style={{ marginTop: 2 }}>
        {label}
      </Text>
    </View>
  );
}
