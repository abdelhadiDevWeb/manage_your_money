import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

type Props = Omit<PressableProps, 'style'> & {
  style?: StyleProp<ViewStyle>;
  /** How far to shrink while pressed. */
  scaleTo?: number;
};

/** Pressable that gives subtle "squish" feedback, used for every tappable surface. */
export function PressableScale({ style, scaleTo = 0.97, ...rest }: Props) {
  return (
    <Pressable
      {...rest}
      style={({ pressed }) => [
        style,
        pressed && { transform: [{ scale: scaleTo }], opacity: 0.85 },
      ]}
    />
  );
}
