import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { haptic } from '@/lib/haptics';

type Option<T extends string> = { value: T; label: string; activeColor?: string };

type Props<T extends string> = {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
};

export function SegmentedControl<T extends string>({ options, value, onChange }: Props<T>) {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.chip }]}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            aria-selected={active}
            onPress={() => {
              if (!active) {
                haptic.tap();
                onChange(option.value);
              }
            }}
            style={[
              styles.segment,
              active && {
                backgroundColor: option.activeColor ?? theme.segmentActive,
                boxShadow: `0px 2px 8px ${theme.shadow}22`,
              },
            ]}>
            <ThemedText
              type="smallBold"
              style={{
                color: active ? (option.activeColor ? '#FFFFFF' : theme.text) : theme.textSecondary,
              }}>
              {option.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: Radius.md,
    padding: Spacing.one,
    gap: Spacing.one,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.two + 2,
    borderRadius: Radius.md - Spacing.one,
  },
});
