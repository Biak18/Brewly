// src/components/ui/Pulse.tsx
import { useTheme } from "@/theme";
import { useEffect } from "react";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

export function Pulse({ style }: { style?: any }) {
  const { colors, radius } = useTheme();
  const opacity = useSharedValue(0.4);
  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 600 }),
        withTiming(0.4, { duration: 600 }),
      ),
      -1,
      true,
    );
  }, [opacity]);
  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View
      style={[
        { backgroundColor: colors.surface2, borderRadius: radius.lg },
        style,
        animatedStyle,
      ]}
    />
  );
}
