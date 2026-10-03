import { Tabs, TabList, TabTrigger, TabSlot, TabTriggerSlotProps, TabListProps } from 'expo-router/ui';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from './themed-text';
import { Icon } from './ui/icon';

import type { IconName } from '@/constants/icons';
import { cardShadow, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type TabIcon = IconName;

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="index" href="/" asChild>
            <TabButton icon="home">Home</TabButton>
          </TabTrigger>
          <TabTrigger name="activity" href="/activity" asChild>
            <TabButton icon="activity">Activity</TabButton>
          </TabTrigger>
          <TabTrigger name="insights" href="/insights" asChild>
            <TabButton icon="insights">Insights</TabButton>
          </TabTrigger>
          <TabTrigger name="settings" href="/settings" asChild>
            <TabButton icon="settings">Settings</TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

export function TabButton({
  children,
  isFocused,
  icon,
  ...props
}: TabTriggerSlotProps & { icon: TabIcon }) {
  const theme = useTheme();
  const color = isFocused ? theme.primary : theme.textSecondary;

  return (
    <Pressable {...props} style={({ pressed }) => [styles.tabButton, pressed && styles.pressed]}>
      <View
        style={[styles.tabInner, isFocused && { backgroundColor: theme.backgroundSelected }]}>
        <Icon name={icon} size={22} color={color} />
        <ThemedText type="caption" style={{ color }}>
          {children}
        </ThemedText>
      </View>
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
  const theme = useTheme();

  return (
    <View {...props} style={styles.tabListContainer}>
      <View
        style={[
          styles.innerContainer,
          { backgroundColor: theme.backgroundElement, borderColor: theme.border },
          cardShadow(theme),
        ]}>
        {props.children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabListContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    padding: Spacing.three,
    alignItems: 'center',
  },
  innerContainer: {
    flexDirection: 'row',
    width: '100%',
    maxWidth: 480,
    padding: Spacing.one + 2,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.one,
  },
  tabButton: {
    flex: 1,
  },
  tabInner: {
    alignItems: 'center',
    gap: 2,
    paddingVertical: Spacing.two,
    borderRadius: Radius.md,
  },
  pressed: {
    opacity: 0.7,
  },
});
