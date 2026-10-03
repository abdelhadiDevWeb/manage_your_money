import '@/global.css';

import { Platform, type ViewStyle } from 'react-native';

export const Brand = {
  primary: '#6C5CE7',
  primaryDeep: '#4834D4',
  primarySoft: '#A29BFE',
  splash: '#5B4BDB',
  income: '#10B981',
  expense: '#F43F5E',
  warning: '#F59E0B',
} as const;

export const Colors = {
  light: {
    text: '#0F1222',
    textSecondary: '#6B7085',
    textMuted: '#9AA0B4',
    background: '#F4F5FA',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#ECEBFD',
    border: '#E6E8F0',
    primary: Brand.primary,
    primaryText: '#FFFFFF',
    income: '#0E9F6E',
    incomeSoft: '#DDF7EC',
    expense: '#E11D48',
    expenseSoft: '#FDE4EA',
    chip: '#EEF0F6',
    segmentActive: '#FFFFFF',
    shadow: '#1B1F3B',
  },
  dark: {
    text: '#F3F4FA',
    textSecondary: '#A3A8BF',
    textMuted: '#6E7390',
    background: '#0B0C14',
    backgroundElement: '#161827',
    backgroundSelected: '#262447',
    border: '#24273A',
    primary: '#8B7FF5',
    primaryText: '#FFFFFF',
    income: '#34D399',
    incomeSoft: '#0F2E25',
    expense: '#FB7185',
    expenseSoft: '#3A1520',
    chip: '#1E2032',
    segmentActive: '#33365A',
    shadow: '#000000',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;
export type Theme = { [K in ThemeColor]: string };

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = {
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
  pill: 999,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80, web: 88 }) ?? 0;
export const MaxContentWidth = 720;

/**
 * Linear gradient background. Native uses React Native's `experimental_backgroundImage`,
 * web passes the CSS property straight through. `backgroundColor` is the fallback.
 */
export function gradient(from: string, to: string, angle = 135): ViewStyle {
  const css = `linear-gradient(${angle}deg, ${from}, ${to})`;
  return Platform.select<ViewStyle>({
    web: { backgroundColor: from, backgroundImage: css } as ViewStyle,
    default: { backgroundColor: from, experimental_backgroundImage: css },
  });
}

export function cardShadow(theme: Theme): ViewStyle {
  return { boxShadow: `0px 6px 20px ${theme.shadow}14` };
}
