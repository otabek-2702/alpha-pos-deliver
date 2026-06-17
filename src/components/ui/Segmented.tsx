/* ============================================================
   Segmented control — .seg / .seg__btn / .seg__count from mobile.css.
   ============================================================ */
import React from 'react';
import { Pressable, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Icon, type IconName } from '@/components/Icon';
import { Text } from './Text';

export type SegmentItem = {
  key: string;
  label: string;
  count?: number;
  icon?: IconName;
};

export function Segmented({
  items,
  value,
  onChange,
  style,
  testIDPrefix,
}: {
  items: SegmentItem[];
  value: string;
  onChange: (key: string) => void;
  style?: object;
  testIDPrefix?: string;
}) {
  const { colors, radii, shadow } = useTheme();
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          padding: 4,
          gap: 3,
          backgroundColor: colors.surfaceInset,
          borderRadius: radii.md,
          borderWidth: 1,
          borderColor: colors.border,
        },
        style,
      ]}
    >
      {items.map((it) => {
        const active = it.key === value;
        return (
          <Pressable
            key={it.key}
            testID={testIDPrefix ? `${testIDPrefix}-${it.key}` : undefined}
            onPress={() => onChange(it.key)}
            style={[
              {
                flex: 1,
                height: 36,
                borderRadius: radii.sm,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                backgroundColor: active ? colors.surface : 'transparent',
              },
              active && shadow.sm,
            ]}
          >
            {it.icon ? (
              <Icon name={it.icon} size={16} color={active ? colors.text : colors.textSecondary} />
            ) : null}
            <Text variant="sm" weight="600" color={active ? 'text' : 'textSecondary'}>
              {it.label}
            </Text>
            {it.count !== undefined ? (
              <View
                style={{
                  paddingHorizontal: 6,
                  paddingVertical: 1,
                  borderRadius: 99,
                  backgroundColor: active ? colors.primaryWeak : colors.neutralWeak,
                }}
              >
                <Text variant="micro" weight="600" color={active ? 'primary' : 'textSecondary'}>
                  {it.count}
                </Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}
