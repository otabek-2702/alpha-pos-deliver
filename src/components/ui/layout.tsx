/* ============================================================
   Layout primitives — Screen, HeaderBar (.ca-head), DetailHeader
   (.det-head), ScrollArea (.ca-scroll/.ca-pad), Spacer, Stack.
   Safe-area insets replace the prototype's fixed 52–56px notch pad.
   ============================================================ */
import React from 'react';
import {
  Pressable,
  ScrollView,
  View,
  type StyleProp,
  type ViewStyle,
  type ScrollViewProps,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';
import { Icon } from '@/components/Icon';
import { Text } from './Text';

export function Screen({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  return <View style={[{ flex: 1, backgroundColor: colors.bg }, style]}>{children}</View>;
}

/** .ca-head — top app bar on a surface, with safe-area top padding. */
export function HeaderBar({
  children,
  flush = false,
  style,
}: {
  children: React.ReactNode;
  flush?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors, space } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        {
          paddingTop: insets.top + 12,
          paddingHorizontal: space[5],
          paddingBottom: space[4],
          backgroundColor: flush ? 'transparent' : colors.surface,
          borderBottomWidth: flush ? 0 : 1,
          borderBottomColor: colors.border,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

/** .det-head — back chevron + title/subtitle row. */
export function DetailHeader({
  title,
  subtitle,
  onBack,
  right,
  backTestID,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
  backTestID?: string;
}) {
  const { colors, radii, space } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        paddingTop: insets.top + 10,
        paddingHorizontal: space[4],
        paddingBottom: space[3],
        flexDirection: 'row',
        alignItems: 'center',
        gap: space[3],
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
    >
      {onBack ? (
        <Pressable
          testID={backTestID}
          onPress={onBack}
          hitSlop={8}
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
          <Icon name="chevleft" size={22} color={colors.textSecondary} />
        </Pressable>
      ) : null}
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 19 }} weight="700">
          {title}
        </Text>
        {subtitle ? (
          <Text variant="label" color="textTertiary">
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right}
    </View>
  );
}

/** .ca-scroll + .ca-pad (+ optional .ca-pad--tab bottom space for the tab bar). */
export function ScrollArea({
  children,
  tabPad = false,
  contentStyle,
  ...rest
}: ScrollViewProps & {
  children: React.ReactNode;
  tabPad?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  const { space } = useTheme();
  return (
    <ScrollView
      style={{ flex: 1 }}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[
        { paddingVertical: space[4], paddingHorizontal: space[5] },
        tabPad && { paddingBottom: 108 },
        contentStyle,
      ]}
      {...rest}
    >
      {children}
    </ScrollView>
  );
}

export function Stack({
  children,
  gap,
  style,
  testID,
}: {
  children: React.ReactNode;
  gap?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  const { space } = useTheme();
  return (
    <View testID={testID} style={[{ gap: gap ?? space[3] }, style]}>
      {children}
    </View>
  );
}

export function Spacer() {
  return <View style={{ flex: 1 }} />;
}
