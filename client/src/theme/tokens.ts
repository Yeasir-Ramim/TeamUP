export interface ColorScheme {
  // Brand & Theme v2 tokens (from TeamUp Design Doc)
  primary: string;
  primarySoft: string;
  secondary: string;
  secondarySoft: string;
  accent: string;
  warning: string;
  background: string;
  surface: string;
  surfaceMuted: string;
  text: string;
  textMuted: string;
  border: string;

  // Compatibility tokens (M3 names mapped for backwards-compat)
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  onSecondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;
  tertiary: string;
  onTertiary: string;
  tertiaryContainer: string;
  onTertiaryContainer: string;
  onBackground: string;
  onSurface: string;
  surfaceVariant: string;
  onSurfaceVariant: string;
  outline: string;
  outlineVariant: string;
  error: string;
  onError: string;
  errorContainer: string;
  onErrorContainer: string;
  shadow: string;
  scrim: string;
  inverseSurface: string;
  inverseOnSurface: string;
  inversePrimary: string;
}

export const lightColorScheme: ColorScheme = {
  // Shadcn UI Light Palette
  primary: '#18181B',
  primarySoft: '#F4F4F5',
  secondary: '#F4F4F5',
  secondarySoft: '#FAFAFA',
  accent: '#F4F4F5',
  warning: '#F59E0B',
  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceMuted: '#F4F4F5',
  text: '#09090B',
  textMuted: '#71717A',
  border: '#E4E4E7',

  // M3 Compatibility aliases
  onPrimary: '#FAFAFA',
  primaryContainer: '#F4F4F5',
  onPrimaryContainer: '#18181B',
  onSecondary: '#18181B',
  secondaryContainer: '#F4F4F5',
  onSecondaryContainer: '#18181B',
  tertiary: '#F4F4F5',
  onTertiary: '#18181B',
  tertiaryContainer: '#F4F4F5',
  onTertiaryContainer: '#18181B',
  onBackground: '#09090B',
  onSurface: '#09090B',
  surfaceVariant: '#F4F4F5',
  onSurfaceVariant: '#71717A',
  outline: '#E4E4E7',
  outlineVariant: '#E4E4E7',
  error: '#EF4444',
  onError: '#FAFAFA',
  errorContainer: '#FEE2E2',
  onErrorContainer: '#991B1B',
  shadow: 'rgba(0, 0, 0, 0.05)',
  scrim: 'rgba(0, 0, 0, 0.4)',
  inverseSurface: '#09090B',
  inverseOnSurface: '#FAFAFA',
  inversePrimary: '#F4F4F5',
};

export const darkColorScheme: ColorScheme = {
  // Shadcn UI Dark Palette
  primary: '#FAFAFA',
  primarySoft: '#27272A',
  secondary: '#27272A',
  secondarySoft: '#18181B',
  accent: '#27272A',
  warning: '#F59E0B',
  background: '#09090B',
  surface: '#09090B',
  surfaceMuted: '#27272A',
  text: '#FAFAFA',
  textMuted: '#A1A1AA',
  border: '#27272A',

  // M3 Compatibility aliases
  onPrimary: '#18181B',
  primaryContainer: '#27272A',
  onPrimaryContainer: '#FAFAFA',
  onSecondary: '#FAFAFA',
  secondaryContainer: '#27272A',
  onSecondaryContainer: '#FAFAFA',
  tertiary: '#27272A',
  onTertiary: '#FAFAFA',
  tertiaryContainer: '#27272A',
  onTertiaryContainer: '#FAFAFA',
  onBackground: '#FAFAFA',
  onSurface: '#FAFAFA',
  surfaceVariant: '#27272A',
  onSurfaceVariant: '#A1A1AA',
  outline: '#27272A',
  outlineVariant: '#27272A',
  error: '#7F1D1D',
  onError: '#FAFAFA',
  errorContainer: '#450A0A',
  onErrorContainer: '#FEE2E2',
  shadow: 'transparent',
  scrim: 'rgba(0, 0, 0, 0.7)',
  inverseSurface: '#FAFAFA',
  inverseOnSurface: '#09090B',
  inversePrimary: '#27272A',
};

export const typography = {
  // TeamUp v2 typography specification
  display: { fontSize: 32, lineHeight: 40, fontWeight: '700' as const },
  h1: { fontSize: 26, lineHeight: 32, fontWeight: '700' as const },
  h2: { fontSize: 20, lineHeight: 26, fontWeight: '700' as const },
  h3: { fontSize: 17, lineHeight: 24, fontWeight: '600' as const },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '400' as const },
  bodySmall: { fontSize: 13, lineHeight: 18, fontWeight: '400' as const },
  label: { fontSize: 12, lineHeight: 16, fontWeight: '600' as const },

  // Compatibility aliases
  displayLarge: { fontSize: 32, lineHeight: 40, fontWeight: '700' as const },
  headlineMedium: { fontSize: 24, lineHeight: 32, fontWeight: '600' as const },
  titleMedium: { fontSize: 18, lineHeight: 24, fontWeight: '600' as const },
  bodyLarge: { fontSize: 16, lineHeight: 24, fontWeight: '400' as const },
  bodyMedium: { fontSize: 14, lineHeight: 20, fontWeight: '400' as const },
  labelMedium: { fontSize: 12, lineHeight: 16, fontWeight: '600' as const },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  screenPadding: 16,
  minTouchTarget: 44,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  bottomSheet: 16,
  pill: 9999,

  // Compatibility alias
  bento: 8,
};

export const elevation = {
  none: {},
  card: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  floating: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  sheet: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
};
