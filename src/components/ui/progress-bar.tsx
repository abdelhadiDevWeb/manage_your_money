import { useEffect } from 'react';
import { StyleSheet, View, type ColorValue } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, Easing } from 'react-native-reanimated';

type Props = {
  /** 0..1, clamped. */
  progress: number;
  color: ColorValue;
  trackColor: ColorValue;
  height?: number;
};

export function ProgressBar({ progress, color, trackColor, height = 8 }: Props) {
  const value = useSharedValue(0);

  useEffect(() => {
    value.value = withTiming(Math.min(Math.max(progress, 0), 1), {
      duration: 700,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress, value]);

  const fillStyle = useAnimatedStyle(() => ({ width: `${value.value * 100}%` }));

  return (
    <View style={[styles.track, { height, borderRadius: height, backgroundColor: trackColor }]}>
      <Animated.View style={[styles.fill, { borderRadius: height, backgroundColor: color }, fillStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
});
