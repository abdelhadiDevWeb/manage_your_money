import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { View, type ColorValue, type StyleProp, type ViewStyle } from 'react-native';

import { Icons, type IconName } from '@/constants/icons';

type Props = {
  name: IconName;
  size?: number;
  color: ColorValue;
  weight?: SymbolViewProps['weight'];
  style?: StyleProp<ViewStyle>;
};

// Icons are decorative; on Android and web SymbolView renders a font glyph that screen readers would announce.
export function Icon({ name, size = 20, color, weight, style }: Props) {
  return (
    <View aria-hidden style={style}>
      <SymbolView name={Icons[name]} size={size} tintColor={color} weight={weight} />
    </View>
  );
}
