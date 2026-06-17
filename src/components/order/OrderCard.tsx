/* ============================================================
   Order cards — ActiveOrderCard + CompletedOrderCard (.ocard) from
   app/screens.jsx. Active card highlights when live (READY/ON_WAY).
   ============================================================ */
import React from 'react';
import { Pressable, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Badge, Text } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { money } from '@/lib/format';
import { stepBadge } from './logic';
import type { ActiveOrder, CompletedOrder } from '@/api/types';

export function ActiveOrderCard({
  order,
  onPress,
  testID,
}: {
  order: ActiveOrder;
  onPress?: () => void;
  testID?: string;
}) {
  const { colors, radii, shadow, space } = useTheme();
  const b = stepBadge(order.step);
  const live = order.step === 'ON_WAY' || order.step === 'READY';

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      style={({ pressed }) => [
        {
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: live ? colors.primaryBorder : colors.border,
          borderRadius: radii.lg,
          overflow: 'hidden',
          transform: [{ scale: pressed ? 0.992 : 1 }],
        },
        live ? shadow.sm : shadow.xs,
      ]}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: space[3],
          padding: space[4],
          paddingBottom: space[3],
        }}
      >
        <Text variant="h3" weight="700" mono>
          #{order.id}
        </Text>
        <Badge tone={b.tone} dot={b.dot}>
          {b.label}
        </Badge>
        <Text variant="sm" color="textTertiary" style={{ marginLeft: 'auto' }}>
          {order.placedAt}
        </Text>
      </View>
      <View style={{ paddingHorizontal: space[4], paddingBottom: space[4], gap: space[3] }}>
        <View style={{ flexDirection: 'row', gap: space[2], alignItems: 'flex-start' }}>
          <Icon name="pin" size={16} color={colors.textTertiary} style={{ marginTop: 1 }} />
          <Text variant="sm" color="textSecondary" style={{ flex: 1 }}>
            <Text variant="sm" weight="600" color="text">
              {order.customer.name}
            </Text>{' '}
            · {order.address.text}
          </Text>
        </View>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: space[2],
            paddingTop: space[3],
            borderTopWidth: 1,
            borderTopColor: colors.border,
          }}
        >
          <Text variant="h3" weight="700" mono>
            {money(order.total)}
          </Text>
          {order.payment === 'UNPAID' ? (
            <Badge tone="warning">Collect cash</Badge>
          ) : (
            <Badge tone="success">Paid</Badge>
          )}
          <Text variant="sm" weight="600" color="successStrong" style={{ marginLeft: 'auto' }}>
            +{money(order.fee)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export function CompletedOrderCard({ order }: { order: CompletedOrder }) {
  const { colors, radii, shadow, space } = useTheme();
  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radii.lg,
        overflow: 'hidden',
        ...shadow.xs,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: space[3],
          padding: space[4],
          paddingBottom: space[3],
        }}
      >
        <Text variant="h3" weight="700" mono>
          #{order.id}
        </Text>
        <Badge tone="neutral">Delivered</Badge>
        <Text variant="sm" color="textTertiary" style={{ marginLeft: 'auto' }}>
          {order.deliveredAt}
        </Text>
      </View>
      <View style={{ paddingHorizontal: space[4], paddingBottom: space[4], gap: space[3] }}>
        <View style={{ flexDirection: 'row', gap: space[2], alignItems: 'flex-start' }}>
          <Icon name="checkcircle" size={16} color={colors.success} style={{ marginTop: 1 }} />
          <Text variant="sm" color="textSecondary" style={{ flex: 1 }}>
            <Text variant="sm" weight="600" color="text">
              {order.customer.name}
            </Text>{' '}
            · {order.area} · {order.minutes} min
          </Text>
        </View>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: space[2],
            paddingTop: space[3],
            borderTopWidth: 1,
            borderTopColor: colors.border,
          }}
        >
          <Text variant="h3" weight="700" mono>
            {money(order.total)}
          </Text>
          <Badge tone="success">Paid</Badge>
          <Text variant="sm" weight="600" color="successStrong" style={{ marginLeft: 'auto' }}>
            +{money(order.fee)}
          </Text>
        </View>
      </View>
    </View>
  );
}
