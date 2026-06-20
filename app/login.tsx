/* ============================================================
   LoginScreen — QR scan OR phone + password tabs, no signup
   (app/screens.jsx LoginScreen). On success: store token in
   secure-store and enter the app.
   ============================================================ */
import React, { useEffect, useState } from 'react';
import { Animated, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/theme/ThemeProvider';
import { Button, Segmented, Text } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { useAppStore } from '@/store/appStore';
import { useLogin } from '@/api/hooks';
import { setToken } from '@/lib/secureToken';
import * as fx from '@/data/fixtures';

export default function LoginScreen() {
  const { colors, radii, shadow, space } = useTheme();
  const setLoggedIn = useAppStore((s) => s.setLoggedIn);
  const [mode, setMode] = useState<'qr' | 'phone'>('qr');
  const [phone, setPhone] = useState('');
  const [pw, setPw] = useState('');
  const [pwFocus, setPwFocus] = useState(false);
  const [phoneFocus, setPhoneFocus] = useState(false);

  const login = useLogin();
  const [error, setError] = useState<string | null>(null);

  const [scan] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scan, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(scan, { toValue: 0, duration: 1200, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [scan]);

  function doLogin() {
    setError(null);
    login.mutate(mode === 'phone' ? { phone, password: pw } : { qr: 'scanned' }, {
      onSuccess: (token) => {
        // Persist best-effort; never block navigation on a slow/locked keystore.
        void setToken(token).catch(() => {});
        setLoggedIn(true);
        router.replace('/orders');
      },
      onError: () =>
        setError(
          mode === 'phone'
            ? 'Invalid phone or password. Check your details and try again.'
            : "Couldn't sign in. Check your connection and try again.",
        ),
    });
  }

  const pending = login.isPending;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }} testID="screen-login">
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: space[6],
        }}
      >
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 18,
            backgroundColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: space[4],
            ...shadow.md,
          }}
        >
          <Text weight="700" color="#fff" style={{ fontSize: 32 }}>
            A
          </Text>
        </View>
        <Text weight="700" style={{ fontSize: 24, letterSpacing: -0.02 * 24 }}>
          Alfa
          <Text weight="700" color="primary" style={{ fontSize: 24 }}>
            {' '}
            POS
          </Text>
        </Text>
        <Text variant="sm" color="textSecondary" style={{ marginTop: 4 }}>
          Courier · {fx.courier.branch}
        </Text>
      </View>

      <View
        style={{
          backgroundColor: colors.surface,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingHorizontal: space[5],
          paddingTop: space[5],
          paddingBottom: 34,
          ...shadow.md,
        }}
      >
        <Segmented
          style={{ marginBottom: 20 }}
          value={mode}
          onChange={(k) => setMode(k as 'qr' | 'phone')}
          testIDPrefix="login-mode"
          items={[
            { key: 'qr', label: 'Scan QR', icon: 'qr' },
            { key: 'phone', label: 'Phone', icon: 'phone' },
          ]}
        />

        {error ? (
          <View
            testID="login-error"
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              padding: 12,
              marginBottom: 16,
              borderRadius: radii.md,
              borderWidth: 1,
              borderColor: colors.errorBorder,
              backgroundColor: colors.errorWeak,
            }}
          >
            <Icon name="info" size={16} color={colors.error} />
            <Text variant="sm" weight="600" color="error" style={{ flex: 1 }}>
              {error}
            </Text>
          </View>
        ) : null}

        {mode === 'qr' ? (
          <View style={{ gap: space[4] }}>
            <View
              style={{
                aspectRatio: 1,
                borderRadius: radii.lg,
                backgroundColor: '#0E1219',
                overflow: 'hidden',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Corner
                style={{
                  top: 18,
                  left: 18,
                  borderRightWidth: 0,
                  borderBottomWidth: 0,
                  borderTopLeftRadius: 8,
                }}
              />
              <Corner
                style={{
                  top: 18,
                  right: 18,
                  borderLeftWidth: 0,
                  borderBottomWidth: 0,
                  borderTopRightRadius: 8,
                }}
              />
              <Corner
                style={{
                  bottom: 18,
                  left: 18,
                  borderRightWidth: 0,
                  borderTopWidth: 0,
                  borderBottomLeftRadius: 8,
                }}
              />
              <Corner
                style={{
                  bottom: 18,
                  right: 18,
                  borderLeftWidth: 0,
                  borderTopWidth: 0,
                  borderBottomRightRadius: 8,
                }}
              />
              <Animated.View
                style={{
                  position: 'absolute',
                  left: 18,
                  right: 18,
                  height: 2,
                  backgroundColor: colors.primary,
                  transform: [
                    {
                      translateY: scan.interpolate({ inputRange: [0, 1], outputRange: [-90, 90] }),
                    },
                  ],
                }}
              />
              <Icon name="qr" size={68} color="rgba(255,255,255,0.22)" />
              <Text
                variant="sm"
                weight="500"
                style={{
                  position: 'absolute',
                  bottom: 22,
                  textAlign: 'center',
                  color: 'rgba(255,255,255,0.6)',
                }}
              >
                Point the camera at your staff QR code
              </Text>
            </View>
            <Button
              variant="primary"
              iconName="scan"
              title={pending ? 'Signing in…' : 'I scanned the code'}
              onPress={doLogin}
              disabled={pending}
              testID="login-qr-submit"
            />
            <Text variant="sm" color="textTertiary" style={{ textAlign: 'center' }}>
              QR is generated by your manager in the admin panel.
            </Text>
          </View>
        ) : (
          <View style={{ gap: space[4] }}>
            <View style={{ gap: 7 }}>
              <Text variant="label" weight="600" color="textSecondary">
                Phone number
              </Text>
              <Control focused={phoneFocus}>
                <Text mono weight="600" color="textSecondary">
                  +998
                </Text>
                <TextInput
                  testID="login-phone"
                  inputMode="numeric"
                  placeholder="90 123 45 67"
                  placeholderTextColor={colors.textTertiary}
                  value={phone}
                  onChangeText={setPhone}
                  onFocus={() => setPhoneFocus(true)}
                  onBlur={() => setPhoneFocus(false)}
                  style={{
                    flex: 1,
                    fontSize: 16,
                    color: colors.text,
                    fontFamily: 'HankenGrotesk_400Regular',
                  }}
                />
              </Control>
            </View>
            <View style={{ gap: 7 }}>
              <Text variant="label" weight="600" color="textSecondary">
                Password
              </Text>
              <Control focused={pwFocus}>
                <Icon name="lock" size={18} color={colors.textTertiary} />
                <TextInput
                  testID="login-password"
                  secureTextEntry
                  placeholder="••••••••"
                  placeholderTextColor={colors.textTertiary}
                  value={pw}
                  onChangeText={setPw}
                  onFocus={() => setPwFocus(true)}
                  onBlur={() => setPwFocus(false)}
                  style={{
                    flex: 1,
                    fontSize: 16,
                    color: colors.text,
                    fontFamily: 'HankenGrotesk_400Regular',
                  }}
                />
              </Control>
            </View>
            <Button
              variant="primary"
              iconName="arrowright"
              title={pending ? 'Signing in…' : 'Log in'}
              onPress={doLogin}
              disabled={pending}
              testID="login-phone-submit"
            />
            <Text variant="sm" color="textTertiary" style={{ textAlign: 'center' }}>
              No account? Ask your manager to register you.
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

function Corner({ style }: { style?: object }) {
  return (
    <View
      style={[
        { position: 'absolute', width: 36, height: 36, borderWidth: 3, borderColor: '#fff' },
        style,
      ]}
    />
  );
}

function Control({ focused, children }: { focused: boolean; children: React.ReactNode }) {
  const { colors, radii } = useTheme();
  return (
    <View
      style={{
        height: 52,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 16,
        borderRadius: radii.md,
        backgroundColor: focused ? colors.surface : colors.surfaceInset,
        borderWidth: 1,
        borderColor: focused ? colors.primary : colors.borderStrong,
      }}
    >
      {children}
    </View>
  );
}
