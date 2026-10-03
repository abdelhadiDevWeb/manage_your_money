import { StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { isIconName } from '@/constants/icons';

export function CategoryBadge({ icon, color, size = 44 }: { icon: string; color: string; size?: number }) {
  return (
    <View
      style={[
        styles.badge,
        { width: size, height: size, borderRadius: size * 0.3, backgroundColor: `${color}1A` },
      ]}>
      <Icon name={isIconName(icon) ? icon : 'other'} size={size * 0.46} color={color} weight="semibold" />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
