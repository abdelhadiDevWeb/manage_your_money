import { ActivityIndicator, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Brand, gradient, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({ label, onPress, variant = 'primary', disabled, loading, style }: Props) {
  const theme = useTheme();

  const variantStyle: ViewStyle =
    variant === 'primary'
      ? { ...gradient(Brand.primary, Brand.primaryDeep), boxShadow: `0px 8px 20px ${Brand.primary}55` }
      : variant === 'danger'
        ? { backgroundColor: theme.expenseSoft }
        : { backgroundColor: theme.chip };
  const textColor = variant === 'primary' ? '#FFFFFF' : variant === 'danger' ? theme.expense : theme.text;

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
      disabled={disabled || loading}
      onPress={onPress}
      style={[styles.button, variantStyle, (disabled || loading) && styles.disabled, style]}>
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <ThemedText type="heading" style={{ color: textColor }}>
          {label}
        </ThemedText>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 54,
    borderRadius: Radius.md + 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },
  disabled: {
    opacity: 0.5,
  },
});
