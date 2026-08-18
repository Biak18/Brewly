// src/components/coffee/FavoriteButton.tsx
import { useThemeStore } from "@/theme/themeStore";
import * as Haptics from "expo-haptics";
import { Heart } from "lucide-react-native";
import { useCallback, useEffect } from "react";
import { Pressable, StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from "react-native-reanimated";

type FavoriteButtonProps = {
  liked: boolean;
  onToggle: () => void;
  size?: number;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function FavoriteButton({
  liked,
  onToggle,
  size = 18,
}: FavoriteButtonProps) {
  const colors = useThemeStore((s) => s.colors);
  const scale = useSharedValue(1);

  useEffect(() => {
    if (liked) {
      scale.value = withSequence(
        withSpring(1.25, { damping: 8 }),
        withSpring(1, { damping: 8 }),
      );
    }
  }, [liked, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onToggle();
  }, [onToggle]);

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={liked ? "Remove from favorites" : "Add to favorites"}
      accessibilityState={{ selected: liked }}
      onPress={handlePress}
      hitSlop={8}
      style={[styles.base, animatedStyle]}
    >
      <Heart
        size={size}
        color={liked ? colors.danger : colors.danger}
        fill={liked ? colors.danger : "none"}
        strokeWidth={1.8}
      />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    width: 33,
    height: 33,
    borderRadius: 17,
    backgroundColor: "#fff8eedc",
    alignItems: "center",
    justifyContent: "center",
  },
});
