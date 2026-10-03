import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const enabled = Platform.OS === 'ios' || Platform.OS === 'android';

export const haptic = {
  tap() {
    if (enabled) Haptics.selectionAsync().catch(() => {});
  },
  success() {
    if (enabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  },
  warning() {
    if (enabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
  },
};
