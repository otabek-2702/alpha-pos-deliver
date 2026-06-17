/* ============================================================
   Root layout — fonts, providers (SafeArea / TanStack Query /
   Theme), the navigation Stack, and the global push-banner overlay.
   ============================================================ */
import React from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/api/queryClient';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';
import { fontAssets } from '@/theme/fonts';
import { PushBanner } from '@/components/PushBanner';
import { IncomingOverlay } from '@/components/motion/IncomingOverlay';
import { useCourierRealtime } from '@/realtime/useCourierRealtime';
import { useAppStore } from '@/store/appStore';

function PushOverlay() {
  const push = useAppStore((s) => s.push);
  const clearPush = useAppStore((s) => s.clearPush);
  const loggedIn = useAppStore((s) => s.loggedIn);
  if (!push) return null;
  return (
    <PushBanner
      data={push}
      onClose={clearPush}
      onOpen={() => {
        clearPush();
        if (loggedIn) router.push('/notifications');
      }}
    />
  );
}

function ThemedRoot() {
  const { colors, isDark } = useTheme();
  useCourierRealtime(); // persistent /ws/courier/ → incoming sheet + ready push (real mode)
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="order/[id]" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="notifications" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="balance" options={{ animation: 'slide_from_right' }} />
      </Stack>
      <PushOverlay />
      <IncomingOverlay />
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts(fontAssets);
  if (!fontsLoaded) return null;
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <ThemedRoot />
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
