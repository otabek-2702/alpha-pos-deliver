/* ============================================================
   FeedError — a non-blocking banner shown at the top of a screen
   when a real-mode query failed (network down / 5xx / 401). Without
   it a failed fetch is invisible: the screen would show empty/zero
   data with no way to tell "nothing yet" from "request failed".
   Tap to retry (refetch the query). Hidden entirely in mock mode.
   ============================================================ */
import React from 'react';
import { Pressable, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Icon } from '@/components/Icon';
import { Text } from './Text';

export function FeedError({
  message = "Couldn't reach the server",
  onRetry,
  testID,
}: {
  message?: string;
  onRetry?: () => void;
  testID?: string;
}) {
  const { colors, radii, space } = useTheme();
  return (
    <View
      testID={testID ?? 'feed-error'}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: space[3],
        padding: space[4],
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: colors.errorBorder,
        backgroundColor: colors.errorWeak,
      }}
    >
      <Icon name="info" size={18} color={colors.error} />
      <Text variant="sm" weight="600" color="error" style={{ flex: 1 }}>
        {message}
      </Text>
      {onRetry ? (
        <Pressable
          testID={(testID ?? 'feed-error') + '-retry'}
          onPress={onRetry}
          hitSlop={8}
          style={({ pressed }) => ({
            paddingHorizontal: space[3],
            paddingVertical: 6,
            borderRadius: radii.sm,
            backgroundColor: pressed ? colors.surface2 : colors.surface,
            borderWidth: 1,
            borderColor: colors.errorBorder,
          })}
        >
          <Text variant="sm" weight="700" color="error">
            Retry
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
