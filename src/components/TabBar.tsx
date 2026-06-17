/* ============================================================
   Bottom tab bar — .tabbar / .tab (mobile.css) + the motion layer:
   sliding indicator, active-icon spring (tabPop), orders badge with
   bump + glow when orderCount increases (motion.css / MOTION.md).
   ============================================================ */
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useTheme } from '@/theme/ThemeProvider';
import { Icon, type IconName } from '@/components/Icon';
import { Text } from '@/components/ui';
import { useT, type StringKey } from '@/i18n';
import { useAppStore } from '@/store/appStore';
import { EASE_SPRING, EASE_OUT } from '@/components/motion';

const TABS: Record<string, { icon: IconName; label: StringKey; testID: string }> = {
  orders: { icon: 'receipt', label: 'nav_orders', testID: 'tab-orders' },
  today: { icon: 'chart', label: 'nav_today', testID: 'tab-today' },
  cash: { icon: 'wallet', label: 'nav_cash', testID: 'tab-cash' },
  profile: { icon: 'user', label: 'nav_profile', testID: 'tab-profile' },
};

export function TabBar({ state, navigation }: BottomTabBarProps) {
  const { colors, space } = useTheme();
  const insets = useSafeAreaInsets();
  const t = useT();
  const orderCount = useAppStore((s) => s.orderCount);

  const tabRoutes = state.routes.filter((r: { name: string }) => TABS[r.name]);
  const count = tabRoutes.length || 4;
  const [barW, setBarW] = useState(0);
  const indW = barW > 0 ? (barW - 20) / count : 0;

  const indX = useSharedValue(0);
  useEffect(() => {
    indX.value = withTiming(state.index * indW, { duration: 340, easing: EASE_SPRING });
  }, [state.index, indW, indX]);
  const indStyle = useAnimatedStyle(() => ({ transform: [{ translateX: indX.value }] }));

  return (
    <View
      onLayout={(e) => setBarW(e.nativeEvent.layout.width)}
      style={{
        flexDirection: 'row',
        paddingTop: 8,
        paddingHorizontal: 10,
        paddingBottom: Math.max(insets.bottom, space[3]),
        backgroundColor: colors.surface,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        position: 'relative',
      }}
    >
      {indW > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={[
            { position: 'absolute', top: 6, left: 10, width: indW, alignItems: 'center' },
            indStyle,
          ]}
        >
          <View
            style={{ width: 22, height: 3, borderRadius: 99, backgroundColor: colors.primary }}
          />
        </Animated.View>
      ) : null}

      {state.routes.map((route: { key: string; name: string }, index: number) => {
        const meta = TABS[route.name];
        if (!meta) return null;
        const active = state.index === index;
        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!active && !event.defaultPrevented) navigation.navigate(route.name);
        };
        return (
          <TabItem
            key={route.key}
            meta={meta}
            label={t(meta.label)}
            active={active}
            onPress={onPress}
            badge={route.name === 'orders' && orderCount > 0 ? orderCount : undefined}
          />
        );
      })}
    </View>
  );
}

function TabItem({
  meta,
  label,
  active,
  onPress,
  badge,
}: {
  meta: { icon: IconName; testID: string };
  label: string;
  active: boolean;
  onPress: () => void;
  badge?: number;
}) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);
  const ty = useSharedValue(0);

  useEffect(() => {
    if (active) {
      scale.value = 0.85;
      ty.value = 2;
      scale.value = withSequence(
        withTiming(1.12, { duration: 252, easing: EASE_SPRING }),
        withTiming(1, { duration: 168, easing: EASE_SPRING }),
      );
      ty.value = withSequence(
        withTiming(-2, { duration: 252, easing: EASE_SPRING }),
        withTiming(0, { duration: 168, easing: EASE_SPRING }),
      );
    }
  }, [active, scale, ty]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: ty.value }, { scale: scale.value }],
  }));

  return (
    <Pressable
      testID={meta.testID}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={active ? { selected: true } : {}}
      style={{ flex: 1, alignItems: 'center', gap: 3, paddingVertical: 6 }}
    >
      <Animated.View style={iconStyle}>
        <Icon
          name={meta.icon}
          size={24}
          weight={active ? 2 : 1.7}
          color={active ? colors.primary : colors.textTertiary}
        />
      </Animated.View>
      <Text
        weight="600"
        color={active ? 'primary' : 'textTertiary'}
        style={{ fontSize: 10.5, letterSpacing: 0.01 * 10.5 }}
      >
        {label}
      </Text>
      {badge !== undefined ? <TabBadge count={badge} /> : null}
    </Pressable>
  );
}

function TabBadge({ count }: { count: number }) {
  const { colors, font } = useTheme();
  const prev = useRef(count);
  const scale = useSharedValue(1);
  const glow = useSharedValue(0);

  useEffect(() => {
    if (count > prev.current) {
      scale.value = withSequence(
        withTiming(1.5, { duration: 200, easing: EASE_SPRING }),
        withTiming(1, { duration: 300, easing: EASE_SPRING }),
      );
      glow.value = 0.7;
      glow.value = withTiming(0, { duration: 600, easing: EASE_OUT });
    }
    prev.current = count;
  }, [count, scale, glow]);

  const badgeStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
    transform: [{ scale: 0.7 + (1 - glow.value / 0.7) * 1.5 }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: 2,
          right: '50%',
          marginRight: -20,
          minWidth: 17,
          height: 17,
          paddingHorizontal: 5,
          borderRadius: 99,
          backgroundColor: colors.error,
          alignItems: 'center',
          justifyContent: 'center',
        },
        badgeStyle,
      ]}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            inset: -4,
            borderRadius: 99,
            borderWidth: 2,
            borderColor: colors.error,
          },
          glowStyle,
        ]}
      />
      <Text style={{ fontFamily: font('mono', '700'), fontSize: 10, color: '#fff' }}>{count}</Text>
    </Animated.View>
  );
}
