/* ============================================================
   NotificationsScreen — app/screens.jsx NotificationsScreen.
   ============================================================ */
import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/theme/ThemeProvider';
import {
  DetailHeader,
  FeedError,
  IconButton,
  Screen,
  ScrollArea,
  Stack,
  Text,
} from '@/components/ui';
import type { ColorTokens } from '@/theme/tokens';
import { Icon } from '@/components/Icon';
import { useQueryClient } from '@tanstack/react-query';
import { qk, useNotifications } from '@/api/hooks';
import { USE_MOCK } from '@/api/config';
import { useAppStore } from '@/store/appStore';
import * as fx from '@/data/fixtures';
import type { CourierNotification } from '@/api/types';

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const qc = useQueryClient();
  const notifQ = useNotifications();
  const list = notifQ.data ?? (USE_MOCK ? fx.notifications : []);
  const showPush = useAppStore((s) => s.showPush);

  function demoPush() {
    showPush({
      icon: 'scooter',
      title: 'New order #58 assigned',
      body: 'Kitchen is preparing it — get ready to pick up.',
      bg: colors.primary,
    });
  }

  return (
    <Screen>
      <DetailHeader
        title="Notifications"
        onBack={() => router.back()}
        backTestID="notifications-back"
        right={
          <IconButton name="bell" iconSize={18} onPress={demoPush} testID="notifications-demo" />
        }
      />
      <ScrollArea contentStyle={{ paddingBottom: 40 }} testID="screen-notifications">
        <Stack>
          {!USE_MOCK && notifQ.isError ? (
            <FeedError
              onRetry={() => void qc.invalidateQueries({ queryKey: qk.notifications })}
              testID="notifications-error"
            />
          ) : null}
          {list.map((n) => (
            <NotifCard key={n.id} n={n} />
          ))}
        </Stack>
      </ScrollArea>
    </Screen>
  );
}

const TONE: Record<CourierNotification['tone'], { bg: keyof ColorTokens; fg: keyof ColorTokens }> =
  {
    primary: { bg: 'primaryWeak', fg: 'primary' },
    success: { bg: 'successWeak', fg: 'success' },
    warning: { bg: 'warningWeak', fg: 'warning' },
    error: { bg: 'errorWeak', fg: 'error' },
    info: { bg: 'infoWeak', fg: 'info' },
  };

function NotifCard({ n }: { n: CourierNotification }) {
  const { colors, radii, space } = useTheme();
  const tone = TONE[n.tone];
  return (
    <View
      style={{
        flexDirection: 'row',
        gap: space[3],
        padding: space[4],
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: n.unread ? colors.primaryBorder : colors.border,
        borderRadius: radii.lg,
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: radii.md,
          backgroundColor: colors[tone.bg],
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name={n.icon} size={20} color={colors[tone.fg]} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text weight="600" style={{ paddingRight: 14 }}>
          {n.title}
        </Text>
        <Text variant="sm" color="textSecondary" style={{ marginTop: 2 }}>
          {n.body}
        </Text>
        <Text variant="label" mono color="textTertiary" style={{ marginTop: space[2] }}>
          Today · {n.at}
        </Text>
      </View>
      {n.unread ? (
        <View
          style={{
            position: 'absolute',
            top: space[4],
            right: space[4],
            width: 8,
            height: 8,
            borderRadius: 99,
            backgroundColor: colors.primary,
          }}
        />
      ) : null}
    </View>
  );
}
