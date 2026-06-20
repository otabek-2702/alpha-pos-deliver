/* ============================================================
   IncomingOrderSheet — new-order arrival (components.jsx
   IncomingOrderSheet). Springs up (340ms ease-spring), countdown
   ring auto-dismisses at 0, hold-to-accept. Scrim fades in.
   ============================================================ */
import React, { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useTheme } from '@/theme/ThemeProvider';
import { Badge, Button, Text } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { useT } from '@/i18n';
import { money } from '@/lib/format';
import type { IncomingOrder } from '@/api/types';
import { RingCountdown } from './RingCountdown';
import { HoldButton } from './HoldButton';
import { EASE_OUT, EASE_SPRING, useReducedMotion } from './easings';

export function IncomingOrderSheet({
  order,
  onAccept,
  onDecline,
  onDismiss,
}: {
  order: IncomingOrder;
  onAccept: () => void;
  /** Explicit "Decline" — frees the order on the server (declineOrder). */
  onDecline: () => void;
  /** Passive close — scrim tap or countdown timeout. Closes the sheet locally;
   *  does NOT actively decline server-side (the server window expires on its own). */
  onDismiss: () => void;
}) {
  const { colors, radii, space } = useTheme();
  const T = useT();
  const reduce = useReducedMotion();
  const y = useSharedValue(reduce ? 0 : 1);
  const fade = useSharedValue(reduce ? 1 : 0);

  useEffect(() => {
    if (reduce) return;
    fade.value = withTiming(1, { duration: 200, easing: EASE_OUT });
    y.value = withTiming(0, { duration: 340, easing: EASE_SPRING });
  }, [reduce, y, fade]);

  const scrimStyle = useAnimatedStyle(() => ({ opacity: fade.value }));
  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: `${y.value * 100}%` }] }));

  return (
    <View style={{ position: 'absolute', inset: 0, zIndex: 88, justifyContent: 'flex-end' }}>
      <Animated.View
        style={[{ position: 'absolute', inset: 0, backgroundColor: colors.overlay }, scrimStyle]}
      >
        <Pressable style={{ flex: 1 }} onPress={onDismiss} testID="incoming-scrim" />
      </Animated.View>
      <Animated.View
        testID="incoming-sheet"
        style={[
          {
            backgroundColor: colors.surface,
            borderTopLeftRadius: radii.xl,
            borderTopRightRadius: radii.xl,
            paddingTop: space[3],
            paddingHorizontal: space[5],
            paddingBottom: 30,
          },
          sheetStyle,
        ]}
      >
        <View
          style={{
            width: 38,
            height: 5,
            borderRadius: 99,
            backgroundColor: colors.borderStrong,
            alignSelf: 'center',
            marginBottom: space[4],
          }}
        />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space[4] }}>
          <RingCountdown seconds={order.expiresIn ?? 20} onExpire={onDismiss} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ fontSize: 19, letterSpacing: -0.02 * 19 }} weight="700">
              {T('new_order')} #{order.id}
            </Text>
            <Text variant="sm" color="textSecondary" style={{ marginTop: 1 }}>
              {order.address.text}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text variant="h3" weight="700" mono>
              {money(order.total)}
            </Text>
            <Text variant="sm" weight="600" color="successStrong">
              +{money(order.fee)}
            </Text>
          </View>
        </View>

        <View style={{ marginVertical: space[4] }}>
          <View
            style={{ flexDirection: 'row', alignItems: 'center', gap: space[2], marginBottom: 10 }}
          >
            <Icon name="scooter" size={16} color={colors.textTertiary} />
            <Text variant="sm" color="textSecondary">
              {order.address.distanceKm} km · {order.customer.name}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: space[2] }}>
            {order.payment === 'UNPAID' ? (
              <Badge tone="warning">
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Icon name="banknote" size={11} color={colors.warningStrong} />
                  <Text variant="label" weight="600" color="warningStrong">
                    {T('collect_cash')}
                  </Text>
                </View>
              </Badge>
            ) : (
              <Badge tone="success">{T('paid')}</Badge>
            )}
            <Badge tone="primary" dot>
              {T('not_ready_yet')}
            </Badge>
          </View>
        </View>

        <View style={{ gap: space[3] }}>
          <HoldButton
            label={T('hold_to_accept')}
            doneLabel={T('accepted')}
            onComplete={onAccept}
            testID="accept-hold"
          />
          <Button
            variant="ghost"
            size="sm"
            title={T('decline')}
            onPress={onDecline}
            testID="incoming-decline"
          />
        </View>
      </Animated.View>
    </View>
  );
}
