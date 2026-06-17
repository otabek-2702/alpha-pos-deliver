/* ============================================================
   Theme runtime — resolves OS scheme + manual pref + accent into
   a typed `theme` object consumed by every primitive/screen.
   ============================================================ */
import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { useAppStore } from '@/store/appStore';
import {
  applyAccent,
  darkColors,
  lightColors,
  radii,
  shadows,
  space,
  type as typeScale,
  type ColorTokens,
  type ShadowStyle,
} from './tokens';
import { fontFamily as resolveFont, type FontFamilyName, type FontWeightToken } from './fonts';

export type Theme = {
  isDark: boolean;
  colors: ColorTokens;
  type: typeof typeScale;
  space: typeof space;
  radii: typeof radii;
  shadow: Record<'xs' | 'sm' | 'md' | 'lg', ShadowStyle>;
  font: (family: FontFamilyName, weight?: FontWeightToken) => string;
};

const ThemeContext = createContext<Theme | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const themePref = useAppStore((s) => s.themePref);
  const accent = useAppStore((s) => s.accent);

  const isDark = themePref === 'system' ? systemScheme === 'dark' : themePref === 'dark';

  const theme = useMemo<Theme>(() => {
    const base = isDark ? darkColors : lightColors;
    return {
      isDark,
      colors: applyAccent(base, accent, isDark),
      type: typeScale,
      space,
      radii,
      shadow: shadows(isDark),
      font: resolveFont,
    };
  }, [isDark, accent]);

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
