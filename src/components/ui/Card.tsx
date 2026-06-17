/* ============================================================
   Card — .card / .card__pad / .card__hd from mobile.css.
   ============================================================ */
import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Icon, type IconName } from '@/components/Icon';
import { Text } from './Text';

export function Card({
  children,
  padded = false,
  style,
  testID,
}: {
  children?: React.ReactNode;
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  const { colors, radii, shadow, space } = useTheme();
  return (
    <View
      testID={testID}
      style={[
        {
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: radii.lg,
          ...shadow.xs,
        },
        padded && { padding: space[4] },
        style,
      ]}
    >
      {children}
    </View>
  );
}

/** .card__hd — uppercase label row with a tertiary icon. */
export function CardHeader({ icon, title }: { icon?: IconName; title: string }) {
  const { colors, space } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: space[2],
        paddingHorizontal: space[4],
        paddingTop: space[4],
        paddingBottom: space[2],
      }}
    >
      {icon ? <Icon name={icon} size={15} color={colors.textTertiary} /> : null}
      <Text
        variant="label"
        weight="600"
        color="textTertiary"
        style={{ letterSpacing: 0.06 * 12, textTransform: 'uppercase' }}
      >
        {title}
      </Text>
    </View>
  );
}
