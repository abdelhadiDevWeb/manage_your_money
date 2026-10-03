import { Image } from 'expo-image';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

// Must match the expo-splash-screen `imageWidth` and `backgroundColor` in app.json.
const LOGO_SIZE = 140;
const SPLASH_BACKGROUND = '#FFFFFF';
const LOGO_LIFT = 64;
const WORDMARK_WIDTH = 230;
const WORDMARK_ASPECT = 1246 / 219;
const MIN_VISIBLE_MS = 1700;

/**
 * Takes over from the native splash (same background and logo, so the handoff is invisible),
 * plays a short brand intro, and fades out once `ready` is true.
 */
export function SplashOverlay({ ready }: { ready: boolean }) {
  const [visible, setVisible] = useState(true);
  const [started, setStarted] = useState(false);
  const [minTimeDone, setMinTimeDone] = useState(false);
  const exiting = ready && minTimeDone;

  const intro = useSharedValue(0);
  const ring = useSharedValue(0);
  const ringOn = useSharedValue(0);
  const exit = useSharedValue(0);

  useEffect(() => {
    if (!started) return;
    intro.value = withTiming(1, { duration: 1100, easing: Easing.out(Easing.exp) });
    ringOn.value = withDelay(200, withTiming(1, { duration: 300 }));
    ring.value = withDelay(
      200,
      withRepeat(withTiming(1, { duration: 1600, easing: Easing.out(Easing.quad) }), -1, false)
    );
    const timer = setTimeout(() => setMinTimeDone(true), MIN_VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [started, intro, ring, ringOn]);

  useEffect(() => {
    if (!exiting) return;
    exit.value = withTiming(1, { duration: 500, easing: Easing.inOut(Easing.cubic) }, (finished) => {
      if (finished) scheduleOnRN(setVisible, false);
    });
  }, [exiting, exit]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: 1 - exit.value,
    transform: [{ scale: 1 + exit.value * 0.12 }],
  }));

  const logoStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(intro.value, [0, 1], [0, -LOGO_LIFT]) },
      { scale: interpolate(intro.value, [0, 0.35, 1], [1, 1.1, 1]) },
    ],
  }));

  const ringA = useAnimatedStyle(() => ringFrame(ring.value, ringOn.value, intro.value));
  const ringB = useAnimatedStyle(() => ringFrame((ring.value + 0.5) % 1, ringOn.value, intro.value));

  const textStyle = useAnimatedStyle(() => ({
    opacity: interpolate(intro.value, [0.25, 1], [0, 1], 'clamp'),
    transform: [{ translateY: interpolate(intro.value, [0, 1], [24, 0]) }],
  }));

  const blobStyle = useAnimatedStyle(() => ({
    opacity: interpolate(intro.value, [0, 1], [0, 1]),
    transform: [{ scale: interpolate(intro.value, [0, 1], [0.6, 1]) }],
  }));

  if (!visible) return null;

  return (
    <Animated.View
      style={[styles.overlay, { pointerEvents: exiting ? 'none' : 'auto' }, overlayStyle]}
      onLayout={() => {
        SplashScreen.hideAsync()
          .catch(() => {})
          .finally(() => setStarted(true));
      }}>
      <Animated.View style={[styles.blob, styles.blobTop, blobStyle]} />
      <Animated.View style={[styles.blob, styles.blobBottom, blobStyle]} />

      <Animated.View style={[styles.ring, ringA]} />
      <Animated.View style={[styles.ring, ringB]} />
      <Animated.View style={logoStyle}>
        <Image source={require('@/assets/images/splash-logo.png')} style={styles.logo} />
      </Animated.View>

      <Animated.View style={[styles.textBlock, textStyle]}>
        <Image
          source={require('@/assets/images/logo-wordmark.png')}
          style={styles.wordmark}
          contentFit="contain"
          accessibilityLabel="Spendwise"
        />
        <Text style={styles.tagline}>Know exactly where your money goes</Text>
      </Animated.View>

      <Animated.View style={[styles.footer, textStyle]}>
        <View style={styles.dot} />
        <Text style={styles.footerText}>Private · Offline · Yours</Text>
        <View style={styles.dot} />
      </Animated.View>
    </Animated.View>
  );
}

function ringFrame(t: number, on: number, intro: number) {
  'worklet';
  return {
    opacity: (1 - t) * 0.35 * on,
    transform: [{ translateY: interpolate(intro, [0, 1], [0, -LOGO_LIFT]) }, { scale: 1 + t * 1.6 }],
  };
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: SPLASH_BACKGROUND,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    zIndex: 1000,
  },
  blob: {
    position: 'absolute',
    width: 420,
    height: 420,
    borderRadius: 210,
  },
  blobTop: {
    top: -160,
    left: -140,
    backgroundColor: '#F3EAFF',
  },
  blobBottom: {
    bottom: -180,
    right: -160,
    backgroundColor: '#FFF6E0',
  },
  ring: {
    position: 'absolute',
    width: LOGO_SIZE + 16,
    height: LOGO_SIZE + 16,
    borderRadius: (LOGO_SIZE + 16) / 2,
    borderWidth: 2,
    borderColor: '#9B4DE0',
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
  },
  textBlock: {
    position: 'absolute',
    top: '50%',
    marginTop: LOGO_SIZE / 2 - LOGO_LIFT + 20,
    alignItems: 'center',
    gap: 10,
  },
  wordmark: {
    width: WORDMARK_WIDTH,
    height: WORDMARK_WIDTH / WORDMARK_ASPECT,
  },
  tagline: {
    color: '#5B5670',
    fontSize: 15,
    fontWeight: 500,
  },
  footer: {
    position: 'absolute',
    bottom: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  footerText: {
    color: '#8A8599',
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#C9B8E8',
  },
});
