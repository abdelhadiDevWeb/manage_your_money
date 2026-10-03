import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type ScrollViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Room reserved under scrollable content for the tab bar and the floating add button. */
export function useBottomSpace() {
  const insets = useSafeAreaInsets();
  return insets.bottom + BottomTabInset + 96;
}

export function ScreenHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <View style={styles.header}>
      <View style={styles.headerText}>
        {subtitle ? (
          <ThemedText type="small" themeColor="textSecondary">
            {subtitle}
          </ThemedText>
        ) : null}
        <ThemedText type="title">{title}</ThemedText>
      </View>
      {right}
    </View>
  );
}

type ScreenProps = ScrollViewProps & {
  title?: string;
  subtitle?: string;
  headerRight?: ReactNode;
  children: ReactNode;
};

export function Screen({ title, subtitle, headerRight, children, contentContainerStyle, ...rest }: ScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const bottom = useBottomSpace();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentInsetAdjustmentBehavior="never"
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      {...rest}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + Spacing.three, paddingBottom: bottom },
        contentContainerStyle,
      ]}>
      <View style={styles.inner}>
        {title ? <ScreenHeader title={title} subtitle={subtitle} right={headerRight} /> : null}
        {children}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    paddingHorizontal: Spacing.three + Spacing.one,
  },
  inner: {
    width: '100%',
    maxWidth: MaxContentWidth,
    gap: Spacing.three + Spacing.one,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
});
