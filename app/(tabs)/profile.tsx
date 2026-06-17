/* ============================================================
   ProfileScreen — profile, vehicle/branch, settings (share location,
   on-shift, test push) + logout (app/screens.jsx ProfileScreen).
   The prototype's Tweaks (theme / language / accent / preview knobs)
   are surfaced here as real in-app settings.
   ============================================================ */
import React from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/theme/ThemeProvider';
import {
  Avatar,
  Badge,
  Button,
  Card,
  Divider,
  HeaderBar,
  ListRow,
  Screen,
  ScrollArea,
  SectionLabel,
  Segmented,
  Stack,
  Switch,
  Text,
} from '@/components/ui';
import { Icon, type IconName } from '@/components/Icon';
import type { RowTone } from '@/components/ui';
import { useAppStore, type Lang } from '@/store/appStore';
import { ACCENT_OPTIONS, type AccentKey } from '@/theme/tokens';
import { clearToken } from '@/lib/secureToken';
import * as fx from '@/data/fixtures';

export default function ProfileScreen() {
  const { colors, isDark, radii, space } = useTheme();
  const c = fx.courier;
  const online = useAppStore((s) => s.online);
  const setOnline = useAppStore((s) => s.setOnline);
  const shareLoc = useAppStore((s) => s.shareLoc);
  const setShareLoc = useAppStore((s) => s.setShareLoc);
  const themePref = useAppStore((s) => s.themePref);
  const setThemePref = useAppStore((s) => s.setThemePref);
  const lang = useAppStore((s) => s.lang);
  const setLang = useAppStore((s) => s.setLang);
  const accent = useAppStore((s) => s.accent);
  const setAccent = useAppStore((s) => s.setAccent);
  const orderStage = useAppStore((s) => s.orderStage);
  const setOrderStage = useAppStore((s) => s.setOrderStage);
  const addressMode = useAppStore((s) => s.addressMode);
  const setAddressMode = useAppStore((s) => s.setAddressMode);
  const qrDemo = useAppStore((s) => s.qrDemo);
  const setQrDemo = useAppStore((s) => s.setQrDemo);
  const showPush = useAppStore((s) => s.showPush);
  const simulateIncoming = useAppStore((s) => s.simulateIncoming);
  const logout = useAppStore((s) => s.logout);

  function demoPush() {
    showPush({
      icon: 'scooter',
      title: 'New order #58 assigned',
      body: 'Kitchen is preparing it — get ready to pick up.',
      bg: colors.primary,
    });
  }

  async function doLogout() {
    await clearToken();
    logout();
    router.replace('/login');
  }

  return (
    <Screen>
      <HeaderBar>
        <Text variant="h1" weight="700" style={{ letterSpacing: -0.02 * 24 }}>
          Profile
        </Text>
      </HeaderBar>

      <ScrollArea tabPad testID="screen-profile">
        <Stack gap={space[4]}>
          {/* identity */}
          <Card padded style={{ flexDirection: 'row', alignItems: 'center', gap: space[4] }}>
            <Avatar initials={c.initials} size="lg" />
            <View style={{ flex: 1 }}>
              <Text weight="700" style={{ fontSize: 19, letterSpacing: -0.02 * 19 }}>
                {c.first} {c.last}
              </Text>
              <Text mono variant="sm" color="textSecondary">
                {c.phone}
              </Text>
              <View style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>
                <Badge tone="primary">{c.id}</Badge>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 5,
                    height: 24,
                    paddingHorizontal: 10,
                    borderRadius: radii.xs,
                    borderWidth: 1,
                    borderColor: colors.warningBorder,
                    backgroundColor: colors.warningWeak,
                  }}
                >
                  <Icon name="star" size={11} color={colors.warningStrong} />
                  <Text variant="label" weight="600" color="warningStrong">
                    {c.rating}
                  </Text>
                </View>
              </View>
            </View>
          </Card>

          {/* vehicle / branch */}
          <Card>
            <ListRow
              icon="scooter"
              tone="neutral"
              title="Vehicle"
              subtitle={`${c.vehicle} · ${c.plate}`}
            />
            <Divider />
            <ListRow icon="store" tone="primary" title="Branch" subtitle={c.branch} />
          </Card>

          {/* settings */}
          <View>
            <SectionLabel>Settings</SectionLabel>
            <Card>
              <ToggleRow
                icon="navigation"
                tone="info"
                title="Share live location"
                subtitle="Cashiers see you while on a delivery"
                on={shareLoc}
                onToggle={() => setShareLoc(!shareLoc)}
                testID="profile-sharelocation"
              />
              <Divider />
              <ToggleRow
                icon="power"
                tone="success"
                title="On shift"
                subtitle="Receive new order assignments"
                on={online}
                onToggle={() => setOnline(!online)}
                testID="profile-online"
              />
              <Divider />
              <ListRow
                icon="bell"
                tone="primary"
                title="Test push notification"
                subtitle="Preview an incoming order alert"
                onPress={demoPush}
                testID="profile-test-push"
                right={<Icon name="chevright" size={18} color={colors.textTertiary} />}
              />
            </Card>
          </View>

          {/* appearance */}
          <View>
            <SectionLabel>Appearance</SectionLabel>
            <Card>
              <ToggleRow
                icon={isDark ? 'moon' : 'sun'}
                tone="neutral"
                title="Dark mode"
                subtitle={themePref === 'system' ? 'Following system' : 'Manual override'}
                on={isDark}
                onToggle={() => setThemePref(isDark ? 'light' : 'dark')}
                testID="theme-toggle"
              />
              <Divider />
              <View style={{ padding: space[4], gap: space[3] }}>
                <Text variant="sm" weight="600" color="textSecondary">
                  Language
                </Text>
                <Segmented
                  value={lang.toLowerCase()}
                  onChange={(k) => setLang(k.toUpperCase() as Lang)}
                  testIDPrefix="lang"
                  items={[
                    { key: 'uz', label: 'UZ' },
                    { key: 'ru', label: 'RU' },
                    { key: 'en', label: 'EN' },
                  ]}
                />
                <Text
                  variant="sm"
                  weight="600"
                  color="textSecondary"
                  style={{ marginTop: space[2] }}
                >
                  Accent
                </Text>
                <View style={{ flexDirection: 'row', gap: space[3] }}>
                  {ACCENT_OPTIONS.map((hex) => (
                    <Pressable
                      key={hex}
                      testID={`accent-${hex}`}
                      onPress={() => setAccent(hex as AccentKey)}
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 99,
                        backgroundColor: hex,
                        borderWidth: 3,
                        borderColor: accent === hex ? colors.text : 'transparent',
                      }}
                    />
                  ))}
                </View>
              </View>
            </Card>
          </View>

          {/* preview (design demo knobs) */}
          <View>
            <SectionLabel icon="sliders">Preview</SectionLabel>
            <Card>
              <View style={{ padding: space[4], gap: space[3] }}>
                <Text variant="sm" weight="600" color="textSecondary">
                  Order stage (order #58)
                </Text>
                <Segmented
                  value={orderStage}
                  onChange={(k) => setOrderStage(k as typeof orderStage)}
                  testIDPrefix="preview-stage"
                  items={[
                    { key: 'Assigned', label: 'Assigned' },
                    { key: 'Ready', label: 'Ready' },
                    { key: 'On the way', label: 'On way' },
                    { key: 'Delivered', label: 'Done' },
                  ]}
                />
                <View style={{ flexDirection: 'row', gap: space[3] }}>
                  <View style={{ flex: 1, gap: space[2] }}>
                    <Text variant="sm" weight="600" color="textSecondary">
                      Address
                    </Text>
                    <Segmented
                      value={addressMode}
                      onChange={(k) => setAddressMode(k as typeof addressMode)}
                      testIDPrefix="preview-address"
                      items={[
                        { key: 'Auto', label: 'Auto' },
                        { key: 'Text', label: 'Text' },
                      ]}
                    />
                  </View>
                  <View style={{ flex: 1, gap: space[2] }}>
                    <Text variant="sm" weight="600" color="textSecondary">
                      QR demo
                    </Text>
                    <Segmented
                      value={qrDemo}
                      onChange={(k) => setQrDemo(k as typeof qrDemo)}
                      testIDPrefix="preview-qr"
                      items={[
                        { key: 'Auto-pay', label: 'Auto' },
                        { key: 'Waiting', label: 'Wait' },
                      ]}
                    />
                  </View>
                </View>
              </View>
            </Card>
          </View>

          {/* motion demo */}
          <View>
            <SectionLabel icon="bolt">Motion demo</SectionLabel>
            <Card>
              <ListRow
                icon="scooter"
                tone="primary"
                title="Simulate new order"
                subtitle="Spring-up sheet · countdown · hold to accept"
                onPress={simulateIncoming}
                testID="simulate-new-order"
                right={<Icon name="chevright" size={18} color={colors.textTertiary} />}
              />
            </Card>
          </View>

          <Button
            variant="secondary"
            iconName="logout"
            title="Log out"
            textColor={colors.error}
            style={{ borderColor: colors.errorBorder }}
            onPress={doLogout}
            testID="profile-logout"
          />
        </Stack>
      </ScrollArea>
    </Screen>
  );
}

function ToggleRow({
  icon,
  tone,
  title,
  subtitle,
  on,
  onToggle,
  testID,
}: {
  icon: IconName;
  tone: RowTone;
  title: string;
  subtitle: string;
  on: boolean;
  onToggle: () => void;
  testID?: string;
}) {
  return (
    <ListRow
      icon={icon}
      tone={tone}
      title={title}
      subtitle={subtitle}
      onPress={onToggle}
      testID={testID}
      right={
        <Switch on={on} onToggle={onToggle} testID={testID ? `${testID}-switch` : undefined} />
      }
    />
  );
}
