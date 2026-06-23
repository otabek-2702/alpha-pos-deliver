/* ============================================================
   ALPHA POS — design tokens, ported 1:1 from styles/tokens.css
   Light-first, dark via scheme. Values are NOT invented — they
   mirror the prototype's :root and [data-theme="dark"] blocks.
   ============================================================ */

export type ColorTokens = {
  // Surfaces & lines
  bg: string;
  bgSubtle: string;
  surface: string;
  surface2: string;
  surfaceInset: string;
  border: string;
  borderStrong: string;
  overlay: string;
  // Text
  text: string;
  textSecondary: string;
  textTertiary: string;
  textDisabled: string;
  textOnAccent: string;
  // Brand accent (primary)
  primary: string;
  primaryHover: string;
  primaryActive: string;
  primaryWeak: string;
  primaryWeak2: string;
  primaryBorder: string;
  primaryRing: string;
  onPrimary: string;
  // Semantic
  success: string;
  successStrong: string;
  successWeak: string;
  successBorder: string;
  warning: string;
  warningStrong: string;
  warningWeak: string;
  warningBorder: string;
  error: string;
  errorStrong: string;
  errorWeak: string;
  errorBorder: string;
  info: string;
  infoStrong: string;
  infoWeak: string;
  infoBorder: string;
  neutralWeak: string;
  neutralBorder: string;
  // Chart palette
  chartRevenue: string;
  chartExpense: string;
  chartCash: string;
  chartCard: string;
  chartGrid: string;
  chartAxis: string;
  chartTrack: string;
  chartTarget: string;
  // Categorical
  c1: string;
  c2: string;
  c3: string;
  c4: string;
  c5: string;
  // Theme-stable "ink" surface (from mobile.css --ink / --ink-fg)
  ink: string;
  inkFg: string;
};

export const lightColors: ColorTokens = {
  bg: '#F4F6F8',
  bgSubtle: '#EEF1F4',
  surface: '#FFFFFF',
  surface2: '#F8FAFB',
  surfaceInset: '#F1F4F7',
  border: '#E4E7EC',
  borderStrong: '#D3D8E0',
  overlay: 'rgba(15, 23, 34, 0.42)',
  text: '#0F1722',
  textSecondary: '#586172',
  textTertiary: '#8A929E',
  textDisabled: '#B4BAC4',
  textOnAccent: '#FFFFFF',
  primary: '#3A5BDB',
  primaryHover: '#2E49B8',
  primaryActive: '#263EA0',
  primaryWeak: '#EDF0FD',
  primaryWeak2: '#DEE4FB',
  primaryBorder: '#C7D1F7',
  primaryRing: 'rgba(58, 91, 219, 0.28)',
  onPrimary: '#FFFFFF',
  success: '#15935A',
  successStrong: '#0F7A4A',
  successWeak: '#E6F4EC',
  successBorder: '#BDE3CD',
  warning: '#B26A00',
  warningStrong: '#8A5200',
  warningWeak: '#FBF0DD',
  warningBorder: '#F0D7A6',
  error: '#C8372A',
  errorStrong: '#A82C21',
  errorWeak: '#FBEBE9',
  errorBorder: '#F1C8C3',
  info: '#1180BE',
  infoStrong: '#0E6A9E',
  infoWeak: '#E6F3FA',
  infoBorder: '#BCE0F1',
  neutralWeak: '#EEF1F4',
  neutralBorder: '#DCE1E8',
  chartRevenue: '#3A5BDB',
  chartExpense: '#E0823C',
  chartCash: '#15935A',
  chartCard: '#3A5BDB',
  chartGrid: '#EAEDF1',
  chartAxis: '#9AA2AE',
  chartTrack: '#EEF1F5',
  chartTarget: '#8A929E',
  c1: '#3A5BDB',
  c2: '#15935A',
  c3: '#E0823C',
  c4: '#6E8BFF',
  c5: '#9AA3B2',
  ink: '#0F1722', // == --text in light (mobile.css)
  inkFg: '#FFFFFF',
};

export const darkColors: ColorTokens = {
  bg: '#0E1219',
  bgSubtle: '#0A0D13',
  surface: '#161B24',
  surface2: '#1B212C',
  surfaceInset: '#11161E',
  border: '#262E3B',
  borderStrong: '#323C4C',
  overlay: 'rgba(3, 6, 12, 0.6)',
  text: '#E8EBF1',
  textSecondary: '#9AA4B2',
  textTertiary: '#6B7585',
  textDisabled: '#4B5563',
  textOnAccent: '#FFFFFF',
  primary: '#6E8BFF',
  primaryHover: '#819AFF',
  primaryActive: '#5C7BF5',
  primaryWeak: '#1C2640',
  primaryWeak2: '#243154',
  primaryBorder: '#34467A',
  primaryRing: 'rgba(110, 139, 255, 0.34)',
  onPrimary: '#0B1020',
  success: '#36C07E',
  successStrong: '#45CE8C',
  successWeak: '#14271E',
  successBorder: '#1F4733',
  warning: '#E5A53B',
  warningStrong: '#F0B557',
  warningWeak: '#2A2113',
  warningBorder: '#4A3A1B',
  error: '#EF6A5B',
  errorStrong: '#F48376',
  errorWeak: '#2C1714',
  errorBorder: '#50271F',
  info: '#45A8E0',
  infoStrong: '#5FB7EA',
  infoWeak: '#11242F',
  infoBorder: '#1E3D4F',
  neutralWeak: '#1E2530',
  neutralBorder: '#2C3543',
  chartRevenue: '#6E8BFF',
  chartExpense: '#E89A5C',
  chartCash: '#36C07E',
  chartCard: '#6E8BFF',
  chartGrid: '#232B38',
  chartAxis: '#5B6572',
  chartTrack: '#222A36',
  chartTarget: '#6B7585',
  c1: '#6E8BFF',
  c2: '#36C07E',
  c3: '#E89A5C',
  c4: '#9DB0FF',
  c5: '#7E8A9C',
  ink: '#1B2230', // [data-theme="dark"] .ca --ink (mobile.css)
  inkFg: '#EAF0FA',
};

/* ---- Accent presets (from app/app.jsx ACCENTS tweak) ---- */
export type AccentKey = '#6E8BFF' | '#36C07E' | '#3A5BDB' | '#0E8F57' | '#E0823C' | '#7A5AE0';
export type AccentPreset = {
  hover: string;
  active: string;
  weak: string;
  weak2: string;
  border: string;
  ring: string;
};

export const accents: Record<AccentKey, AccentPreset> = {
  // Design v2 default accent — lighter blue, paired with dark mode.
  '#6E8BFF': {
    hover: '#819AFF',
    active: '#5C7BF5',
    weak: '#EDF0FD',
    weak2: '#DEE4FB',
    border: '#C7D1F7',
    ring: 'rgba(110,139,255,.34)',
  },
  // Design v2 green swatch (derived variants — not in the design's preset map).
  '#36C07E': {
    hover: '#2BA86C',
    active: '#239058',
    weak: '#E7F7EF',
    weak2: '#CFEFDD',
    border: '#B8E6CC',
    ring: 'rgba(54,192,126,.26)',
  },
  '#3A5BDB': {
    hover: '#2E49B8',
    active: '#263EA0',
    weak: '#EDF0FD',
    weak2: '#DEE4FB',
    border: '#C7D1F7',
    ring: 'rgba(58,91,219,.28)',
  },
  '#0E8F57': {
    hover: '#0B7A49',
    active: '#09653C',
    weak: '#E6F4EC',
    weak2: '#CFEADB',
    border: '#BDE3CD',
    ring: 'rgba(14,143,87,.26)',
  },
  '#E0823C': {
    hover: '#C76E2B',
    active: '#A85A22',
    weak: '#FBF0E5',
    weak2: '#F6E1CC',
    border: '#F0D2B2',
    ring: 'rgba(224,130,60,.26)',
  },
  '#7A5AE0': {
    hover: '#6747C9',
    active: '#553AAD',
    weak: '#F0ECFC',
    weak2: '#E3DBF9',
    border: '#D2C6F2',
    ring: 'rgba(122,90,224,.26)',
  },
};

export const ACCENT_OPTIONS: AccentKey[] = ['#6E8BFF', '#36C07E', '#E0823C', '#7A5AE0'];

/**
 * Apply an accent preset onto a base scheme exactly as app.jsx does:
 * primary/hover/active/ring always override; weak/weak2/border override in LIGHT only.
 */
export function applyAccent(base: ColorTokens, accent: AccentKey, isDark: boolean): ColorTokens {
  const a = accents[accent];
  const next: ColorTokens = {
    ...base,
    primary: accent,
    primaryHover: a.hover,
    primaryActive: a.active,
    primaryRing: a.ring,
  };
  if (!isDark) {
    next.primaryWeak = a.weak;
    next.primaryWeak2 = a.weak2;
    next.primaryBorder = a.border;
  }
  return next;
}

/* ---- Type scale (px / line-height) — tokens.css ---- */
export const type = {
  display: { fontSize: 32, lineHeight: 40 },
  h1: { fontSize: 24, lineHeight: 32 },
  h2: { fontSize: 19, lineHeight: 28 },
  h3: { fontSize: 15, lineHeight: 22 },
  body: { fontSize: 14, lineHeight: 22 },
  sm: { fontSize: 13, lineHeight: 20 },
  label: { fontSize: 12, lineHeight: 16 },
  micro: { fontSize: 11, lineHeight: 14 },
  kpi: { fontSize: 30, lineHeight: 36 },
  kpiLg: { fontSize: 34, lineHeight: 40 },
} as const;

export type TypeVariant = keyof typeof type;

export const fontWeights = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

export const trackingLabel = 0.06 * 12; // 0.06em at label size ≈ letterSpacing in px

/* ---- Spacing scale (4px base) — sp-1..sp-10 ---- */
export const space = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 32,
  8: 40,
  9: 48,
  10: 64,
} as const;

/* ---- Radii ---- */
export const radii = {
  xs: 6,
  sm: 8,
  md: 10,
  lg: 14,
  xl: 20,
  pill: 999,
} as const;

/* ---- Elevation → RN shadow presets (approximated from CSS box-shadows) ---- */
export type ShadowStyle = {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
};

export function shadows(isDark: boolean): Record<'xs' | 'sm' | 'md' | 'lg', ShadowStyle> {
  const c = '#000';
  const k = isDark ? 1.6 : 1; // dark shadows are heavier in the prototype
  return {
    xs: {
      shadowColor: c,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05 * k,
      shadowRadius: 2,
      elevation: 1,
    },
    sm: {
      shadowColor: c,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1 * k,
      shadowRadius: 3,
      elevation: 2,
    },
    md: {
      shadowColor: c,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.1 * k,
      shadowRadius: 16,
      elevation: 6,
    },
    lg: {
      shadowColor: c,
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.18 * k,
      shadowRadius: 24,
      elevation: 12,
    },
  };
}
