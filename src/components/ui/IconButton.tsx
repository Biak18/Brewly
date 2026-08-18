// src/components/ui/IconButton.tsx
import { useThemeStore } from "@/theme/themeStore";
import * as Haptics from "expo-haptics";
import React, { useCallback } from "react";
import { Pressable, StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

type IconButtonProps = {
  onPress: () => void;
  children: React.ReactNode;
  accessibilityLabel: string;
  variant?: "default" | "filled";
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function IconButton({
  onPress,
  children,
  accessibilityLabel,
  variant = "default",
}: IconButtonProps) {
  const colors = useThemeStore((s) => s.colors);
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = useCallback(() => {
    Haptics.selectionAsync();
    onPress();
  }, [onPress]);

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={handlePress}
      onPressIn={() => {
        scale.value = withSpring(0.9);
      }}
      onPressOut={() => {
        scale.value = withSpring(1);
      }}
      hitSlop={8}
      style={[
        styles.base,
        {
          borderColor: colors.line,
          backgroundColor:
            variant === "filled" ? colors.surface2 : colors.surface,
        },
        animatedStyle,
      ]}
    >
      {children}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
