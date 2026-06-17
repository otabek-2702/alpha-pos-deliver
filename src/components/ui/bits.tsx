/* ============================================================
   Small primitives: SectionLabel (.ca-sectlabel), Divider
   (.divider), Avatar (.avatar / --lg) from mobile.css.
   ============================================================ */
import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Icon, type IconName } from '@/components/Icon';
import { Text } from './Text';

export function SectionLabel({
  icon,
  children,
  count,
  style,
}: {
  icon?: IconName;
  children: React.ReactNode;
  count?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors, space } = useTheme();
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: space[2],
          marginTop: space[2],
          marginBottom: 2,
        },
        style,
      ]}
    >
      {icon ? <Icon name={icon} size={13} color={colors.textTertiary} /> : null}
      <Text
        variant="label"
        weight="600"
        color="textTertiary"
        style={{ letterSpacing: 0.06 * 12, textTransform: 'uppercase' }}
      >
        {children}
      </Text>
      {count !== undefined ? (
        <Text
          variant="label"
          weight="600"
          color="textSecondary"
          style={{ letterSpacing: 0.06 * 12, textTransform: 'uppercase' }}
        >
          {count}
        </Text>
      ) : null}
    </View>
  );
}

export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  const { colors } = useTheme();
  return <View style={[{ height: 1, backgroundColor: colors.border }, style]} />;
}

export function Avatar({ initials, size = 'md' }: { initials: string; size?: 'md' | 'lg' }) {
  const { colors } = useTheme();
  const dim = size === 'lg' ? 64 : 42;
  return (
    <View
      style={{
        width: dim,
        height: dim,
        borderRadius: 99,
        backgroundColor: colors.primaryWeak,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text weight="700" color="primary" style={{ fontSize: size === 'lg' ? 22 : 13 }}>
        {initials}
      </Text>
    </View>
  );
}
