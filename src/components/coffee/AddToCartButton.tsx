// src/components/coffee/AddToCartButton.tsx
import { useTheme } from "@/theme";
import * as Haptics from "expo-haptics";
import { Plus } from "lucide-react-native";
import { useCallback } from "react";
import { Pressable, StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from "react-native-reanimated";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function AddToCartButton({ onPress }: { onPress: () => void }) {
  const { colors, radius } = useTheme();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = useCallback(() => {
    scale.value = withSequence(
      withSpring(0.8, { damping: 10 }),
      withSpring(1, { damping: 10 }),
    );
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onPress();
  }, [onPress, scale]);

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel="Add to cart"
      onPress={handlePress}
      hitSlop={8}
      style={[
        styles.base,
        { backgroundColor: colors.espresso, borderRadius: radius.sm },
        animatedStyle,
      ]}
    >
      <Plus size={16} color={colors.surface} strokeWidth={2} />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
});
