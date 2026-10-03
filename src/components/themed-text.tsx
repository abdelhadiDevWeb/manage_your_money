import { StyleSheet, Text, type TextProps } from 'react-native';

import { ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'display' | 'title' | 'subtitle' | 'heading' | 'small' | 'smallBold' | 'caption';
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();

  return (
    <Text
      style={[{ color: theme[themeColor ?? 'text'] }, styles[type], style]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: 500,
  },
  display: {
    fontSize: 38,
    lineHeight: 44,
    fontWeight: 700,
    letterSpacing: -0.8,
    fontVariant: ['tabular-nums'],
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: 700,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: 600,
    letterSpacing: -0.3,
  },
  heading: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: 600,
    letterSpacing: -0.1,
  },
  small: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: 500,
  },
  smallBold: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: 700,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: 600,
    letterSpacing: 0.3,
  },
});
