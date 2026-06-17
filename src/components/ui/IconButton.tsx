/* ============================================================
   IconButton — .iconbtn (42×42 bordered surface square) + the
   unread .iconbtn__dot, from mobile.css.
   ============================================================ */
import React from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Icon, type IconName } from '@/components/Icon';

export function IconButton({
  name,
  iconSize = 20,
  onPress,
  dot = false,
  size = 42,
  bordered = true,
  color,
  background,
  style,
  testID,
}: {
  name: IconName;
  iconSize?: number;
  onPress?: () => void;
  dot?: boolean;
  size?: number;
  bordered?: boolean;
  color?: string;
  background?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  const { colors, radii } = useTheme();
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      style={({ pressed }) => [
        {
          width: size,
          height: size,
          borderRadius: radii.md,
          borderWidth: bordered ? 1 : 0,
          borderColor: colors.border,
          backgroundColor: pressed ? colors.surface2 : (background ?? colors.surface),
          alignItems: 'center',
          justifyContent: 'center',
          transform: [{ scale: pressed ? 0.9 : 1 }],
        },
        style,
      ]}
    >
      <Icon name={name} size={iconSize} color={color ?? colors.textSecondary} />
      {dot ? (
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
  );
}
