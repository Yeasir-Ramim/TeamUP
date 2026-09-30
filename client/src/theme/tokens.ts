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
  // Linear-style Light Palette
  primary: '#5E6AD2',
  primarySoft: '#EBEFFF',
  secondary: '#2FB592',
  secondarySoft: '#E5F7F3',
  accent: '#E65050',
  warning: '#F09000',
  background: '#FFFFFF',
  surface: '#F9FAFB',
  surfaceMuted: '#F3F4F6',
  text: '#111827',
  textMuted: '#6B7280',
  border: 'rgba(0, 0, 0, 0.08)',

  // M3 Compatibility aliases
  onPrimary: '#FFFFFF',
  primaryContainer: '#EBEFFF',
  onPrimaryContainer: '#3C459D',
  onSecondary: '#FFFFFF',
  secondaryContainer: '#E5F7F3',
  onSecondaryContainer: '#1F7A62',
  tertiary: '#E65050',
  onTertiary: '#FFFFFF',
  tertiaryContainer: '#FCECEC',
  onTertiaryContainer: '#A13838',
  onBackground: '#111827',
  onSurface: '#111827',
  surfaceVariant: '#F9FAFB',
  onSurfaceVariant: '#6B7280',
  outline: 'rgba(0, 0, 0, 0.16)',
  outlineVariant: 'rgba(0, 0, 0, 0.08)',
  error: '#E65050',
  onError: '#FFFFFF',
  errorContainer: '#FCECEC',
  onErrorContainer: '#A13838',
  shadow: 'rgba(0, 0, 0, 0.04)',
  scrim: 'rgba(0, 0, 0, 0.4)',
  inverseSurface: '#111827',
  inverseOnSurface: '#FFFFFF',
  inversePrimary: '#8493F0',
};

export const darkColorScheme: ColorScheme = {
  // Linear-style Dark Palette
  primary: '#5E6AD2',
  primarySoft: '#1F223D',
  secondary: '#2FB592',
  secondarySoft: '#1A332C',
  accent: '#E65050',
  warning: '#F09000',
  background: '#0E0F11',
  surface: '#1A1D21',
  surfaceMuted: '#22252A',
  text: '#F4F4F5',
  textMuted: '#8B8D98',
  border: 'rgba(255, 255, 255, 0.08)',

  // M3 Compatibility aliases
  onPrimary: '#FFFFFF',
  primaryContainer: '#1F223D',
  onPrimaryContainer: '#D0D6FF',
  onSecondary: '#FFFFFF',
  secondaryContainer: '#1A332C',
  onSecondaryContainer: '#9EF2DB',
  tertiary: '#E65050',
  onTertiary: '#FFFFFF',
  tertiaryContainer: '#401A1A',
  onTertiaryContainer: '#FFD9D9',
  onBackground: '#F4F4F5',
  onSurface: '#F4F4F5',
  surfaceVariant: '#1A1D21',
  onSurfaceVariant: '#8B8D98',
  outline: 'rgba(255, 255, 255, 0.16)',
  outlineVariant: 'rgba(255, 255, 255, 0.08)',
  error: '#E65050',
  onError: '#FFFFFF',
  errorContainer: '#401A1A',
  onErrorContainer: '#FFD9D9',
  shadow: 'transparent',
  scrim: 'rgba(0, 0, 0, 0.7)',
  inverseSurface: '#F4F4F5',
  inverseOnSurface: '#0E0F11',
  inversePrimary: '#5E6AD2',
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
  md: 6,
  lg: 10,
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
