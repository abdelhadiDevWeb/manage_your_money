import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Icon } from '@/components/ui/icon';
import { Spacing } from '@/constants/theme';
import type { IconName } from '@/constants/icons';
import { useTheme } from '@/hooks/use-theme';

export function EmptyState({
  icon,
  title,
  message,
  action,
}: {
  icon: IconName;
  title: string;
  message: string;
  action?: ReactNode;
}) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <View style={[styles.iconWrap, { backgroundColor: theme.backgroundSelected }]}>
        <Icon name={icon} size={28} color={theme.primary} weight="medium" />
      </View>
      <ThemedText type="heading" style={styles.center}>
        {title}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
        {message}
      </ThemedText>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: Spacing.five,
    paddingHorizontal: Spacing.four,
    gap: Spacing.two,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  center: {
    textAlign: 'center',
    maxWidth: 300,
  },
});
