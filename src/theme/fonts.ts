/* ============================================================
   Font wiring — Hanken Grotesk (sans) + JetBrains Mono (mono),
   matching the prototype's Google Fonts import. RN needs one
   named face per weight, so we map weight → face explicitly.
   ============================================================ */
import {
  HankenGrotesk_400Regular,
  HankenGrotesk_500Medium,
  HankenGrotesk_600SemiBold,
  HankenGrotesk_700Bold,
} from '@expo-google-fonts/hanken-grotesk';
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
  JetBrainsMono_600SemiBold,
  JetBrainsMono_700Bold,
} from '@expo-google-fonts/jetbrains-mono';

/** Asset map handed to expo-font's useFonts(). */
export const fontAssets = {
  HankenGrotesk_400Regular,
  HankenGrotesk_500Medium,
  HankenGrotesk_600SemiBold,
  HankenGrotesk_700Bold,
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
  JetBrainsMono_600SemiBold,
  JetBrainsMono_700Bold,
};

export type FontFamilyName = 'sans' | 'mono';
export type FontWeightToken = '400' | '500' | '600' | '700';

const SANS: Record<FontWeightToken, string> = {
  '400': 'HankenGrotesk_400Regular',
  '500': 'HankenGrotesk_500Medium',
  '600': 'HankenGrotesk_600SemiBold',
  '700': 'HankenGrotesk_700Bold',
};

const MONO: Record<FontWeightToken, string> = {
  '400': 'JetBrainsMono_400Regular',
  '500': 'JetBrainsMono_500Medium',
  '600': 'JetBrainsMono_600SemiBold',
  '700': 'JetBrainsMono_700Bold',
};

/** Resolve a concrete loaded font face for a family + weight. */
export function fontFamily(family: FontFamilyName, weight: FontWeightToken = '400'): string {
  return family === 'mono' ? MONO[weight] : SANS[weight];
}
