/* ============================================================
   PayShell — the full-screen .pay overlay (payments.css) shared by
   CashSheet / SplitSheet / QRPayScreen / PaidView. Absolute over the
   order detail; optional `paid` flips to the success-green variant.
   ============================================================ */
import React from 'react';
import { Pressable, ScrollView, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';
import { Icon, type IconName } from '@/components/Icon';
import { Text } from '@/components/ui';

export function PayShell({
  title,
  paid = false,
  onClose,
  closeIcon = 'chevleft',
  closeRight = false,
  children,
  foot,
  bodyStyle,
  testID,
  closeTestID,
}: {
  title?: string;
  paid?: boolean;
  onClose: () => void;
  closeIcon?: IconName;
  closeRight?: boolean;
  children: React.ReactNode;
  foot?: React.ReactNode;
  bodyStyle?: StyleProp<ViewStyle>;
  testID?: string;
  closeTestID?: string;
}) {
  const { colors, radii, space } = useTheme();
  const insets = useSafeAreaInsets();

  const closeBtn = (
    <Pressable
      testID={closeTestID}
      onPress={onClose}
      style={{
        width: 42,
        height: 42,
        borderRadius: radii.md,
        borderWidth: 1,
        borderColor: paid ? 'rgba(255,255,255,.25)' : colors.border,
        backgroundColor: paid ? 'rgba(255,255,255,.18)' : colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon
        name={closeIcon}
        size={closeIcon === 'close' ? 20 : 22}
        color={paid ? '#fff' : colors.textSecondary}
      />
    </Pressable>
  );

  return (
    <View
      testID={testID}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 80,
        backgroundColor: paid ? colors.successStrong : colors.bg,
      }}
    >
      <View
        style={{
          paddingTop: insets.top + 10,
          paddingHorizontal: space[4],
          paddingBottom: space[3],
          flexDirection: 'row',
          alignItems: 'center',
          gap: space[3],
        }}
      >
        {closeRight ? (
          <>
            <View style={{ flex: 1 }} />
            {closeBtn}
          </>
        ) : (
          <>
            {closeBtn}
            {title ? (
              <Text
                style={{ fontSize: 18, letterSpacing: -0.02 * 18 }}
                weight="700"
                color={paid ? '#fff' : colors.text}
              >
                {title}
              </Text>
            ) : null}
          </>
        )}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          {
            alignItems: 'center',
            paddingHorizontal: space[5],
            paddingTop: space[2],
            paddingBottom: space[5],
          },
          bodyStyle,
        ]}
      >
        {children}
      </ScrollView>

      {foot ? (
        <View
          style={{
            paddingHorizontal: space[4],
            paddingTop: space[3],
            paddingBottom: 28,
            gap: space[2],
          }}
        >
          {foot}
        </View>
      ) : null}
    </View>
  );
}
