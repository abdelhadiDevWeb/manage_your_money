import { router } from 'expo-router';
import { StyleSheet } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/ui/icon';
import { PressableScale } from '@/components/ui/pressable-scale';
import { BottomTabInset, Brand, gradient, Spacing } from '@/constants/theme';
import { haptic } from '@/lib/haptics';

/** Floating "add transaction" button shown above the tab bar. */
export function AddTransactionFab() {
  const insets = useSafeAreaInsets();

  return (
    <Animated.View
      entering={ZoomIn.springify().delay(150)}
      style={[styles.wrapper, { bottom: insets.bottom + BottomTabInset + Spacing.three }]}>
      <PressableScale
        scaleTo={0.92}
        accessibilityRole="button"
        accessibilityLabel="Add transaction"
        onPress={() => {
          haptic.tap();
          router.push('/add');
        }}
        style={[styles.button, gradient(Brand.primary, Brand.primaryDeep)]}>
        <Icon name="add" size={26} weight="bold" color="#FFFFFF" />
      </PressableScale>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    right: Spacing.four,
  },
  button: {
    width: 62,
    height: 62,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: `0px 10px 24px ${Brand.primary}66`,
  },
});
