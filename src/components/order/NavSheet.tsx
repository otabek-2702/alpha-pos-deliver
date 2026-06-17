/* ============================================================
   NavSheet — "Open route in…" handoff sheet (app/components.jsx).
   Rows open the real external app via Linking (src/lib/nav.ts);
   Copy address writes coords+text to the clipboard.
   ============================================================ */
import React from 'react';
import { Pressable, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Sheet, Text } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { copyAddress, openNavApp, type NavApp } from '@/lib/nav';
import type { ActiveOrder } from '@/api/types';

const NAV_APPS: { key: NavApp; name: string; sub: string; logo: string; bg: string; fg: string }[] =
  [
    {
      key: 'yandexnav',
      name: 'Yandex Navigator',
      sub: 'Build route & start driving',
      logo: 'Y',
      bg: '#FFCC00',
      fg: '#1A1A1A',
    },
    {
      key: 'yandexmaps',
      name: 'Yandex Maps',
      sub: 'Open location on the map',
      logo: 'Я',
      bg: '#FF3333',
      fg: '#fff',
    },
    {
      key: 'google',
      name: 'Google Maps',
      sub: 'Navigate with Google',
      logo: 'G',
      bg: '#1A73E8',
      fg: '#fff',
    },
    {
      key: '2gis',
      name: '2GIS',
      sub: 'Detailed city navigation',
      logo: '2',
      bg: '#19AA1E',
      fg: '#fff',
    },
  ];

function NavRow({
  logo,
  bg,
  fg,
  title,
  sub,
  right,
  onPress,
  testID,
}: {
  logo: React.ReactNode;
  bg: string;
  fg: string;
  title: string;
  sub: string;
  right?: React.ReactNode;
  onPress: () => void;
  testID?: string;
}) {
  const { colors, radii, space } = useTheme();
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: space[3],
        padding: space[3],
        borderRadius: radii.md,
        backgroundColor: pressed ? colors.surface2 : 'transparent',
      })}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: radii.md,
          backgroundColor: bg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {typeof logo === 'string' ? (
          <Text weight="700" color={fg} style={{ fontSize: 17 }}>
            {logo}
          </Text>
        ) : (
          logo
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Text weight="600">{title}</Text>
        <Text variant="sm" color="textSecondary">
          {sub}
        </Text>
      </View>
      {right}
    </Pressable>
  );
}

export function NavSheet({ order, onClose }: { order: ActiveOrder; onClose: () => void }) {
  const { colors, space } = useTheme();
  const addr = order.address;
  return (
    <Sheet testID="nav-sheet" title="Open route in…" subtitle={addr.text} onClose={onClose}>
      <View style={{ gap: space[1] }}>
        {NAV_APPS.map((app) => (
          <NavRow
            key={app.key}
            testID={`nav-app-${app.key}`}
            logo={app.logo}
            bg={app.bg}
            fg={app.fg}
            title={app.name}
            sub={app.sub}
            right={<Icon name="external" size={18} color={colors.textTertiary} />}
            onPress={() => {
              void openNavApp(app.key, addr);
              onClose();
            }}
          />
        ))}
        <View style={{ height: 4 }} />
        <NavRow
          testID="nav-copy"
          logo={<Icon name="copy" size={20} color={colors.textSecondary} />}
          bg={colors.surfaceInset}
          fg={colors.textSecondary}
          title="Copy address"
          sub={addr.coords ? 'Coordinates + text' : 'Text address'}
          onPress={() => {
            void copyAddress(addr);
            onClose();
          }}
        />
      </View>
    </Sheet>
  );
}
