// src/features/coffee/components/CoffeeHero.tsx
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { Heart } from "lucide-react-native";
import { StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Extrapolation,
  SharedValue,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

const HERO_HEIGHT = 340;

type CoffeeHeroProps = {
  imageUrl: string;
  scrollY: SharedValue<number>;
  onDoubleTapFavorite: () => void;
};

export function CoffeeHero({
  imageUrl,
  scrollY,
  onDoubleTapFavorite,
}: CoffeeHeroProps) {
  const burstScale = useSharedValue(0);
  const burstOpacity = useSharedValue(0);

  const imageStyle = useAnimatedStyle(() => {
    // Over-scroll (pull down) scales the image up; scrolling content up shrinks/lifts it.
    const scale = interpolate(
      scrollY.value,
      [-150, 0, HERO_HEIGHT],
      [1.3, 1, 1.15],
      Extrapolation.CLAMP,
    );
    const translateY = interpolate(
      scrollY.value,
      [0, HERO_HEIGHT],
      [0, -HERO_HEIGHT / 3],
      Extrapolation.CLAMP,
    );
    return { transform: [{ scale }, { translateY }] };
  });

  const burstStyle = useAnimatedStyle(() => ({
    opacity: burstOpacity.value,
    transform: [{ scale: burstScale.value }],
  }));

  // Animations run directly on the UI thread inside the worklet. Only the two
  // calls that genuinely require the JS thread — a native Haptics module call,
  // and the favorite mutation touching React Query — cross via runOnJS. No
  // reason to bounce the animation itself through JS first.
  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      burstOpacity.value = withSequence(
        withTiming(1, { duration: 120 }),
        withTiming(0, { duration: 400 }),
      );
      burstScale.value = withSequence(
        withSpring(1.4, { damping: 6 }),
        withSpring(1, { damping: 8 }),
      );
      scheduleOnRN(Haptics.impactAsync, Haptics.ImpactFeedbackStyle.Medium);

      scheduleOnRN(onDoubleTapFavorite);
    });

  return (
    <View style={{ height: HERO_HEIGHT, overflow: "hidden" }}>
      <GestureDetector gesture={doubleTap}>
        <Animated.View style={StyleSheet.absoluteFill}>
          <Animated.View style={[StyleSheet.absoluteFill, imageStyle]}>
            <Image
              source={{ uri: imageUrl }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              transition={200}
            />
          </Animated.View>
        </Animated.View>
      </GestureDetector>
      <Animated.View pointerEvents="none" style={[styles.burst, burstStyle]}>
        <Heart size={90} color="#fff" fill="#fff" />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  burst: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginTop: -45,
    marginLeft: -45,
  },
});
