// src/components/ui/Chip.tsx
import { useTheme } from "@/theme";
import * as Haptics from "expo-haptics";
import { useCallback, useEffect } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

type ChipProps = { label: string; active: boolean; onPress: () => void };

const AnimatedText = Animated.createAnimatedComponent(Text);
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Chip({ label, active, onPress }: ChipProps) {
  const { colors, radius, spacing } = useTheme();
  const progress = useSharedValue(active ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(active ? 1 : 0, { duration: 180 });
  }, [active, progress]);

  const containerStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [colors.surface, colors.espresso],
    ),
    borderColor: interpolateColor(
      progress.value,
      [0, 1],
      [colors.line, colors.espresso],
    ),
  }));
  const textStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      progress.value,
      [0, 1],
      [colors.muted, colors.surface],
    ),
  }));

  const handlePress = useCallback(() => {
    Haptics.selectionAsync();
    onPress();
  }, [onPress]);

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={handlePress}
      style={[
        styles.base,
        { borderRadius: radius.pill, paddingHorizontal: spacing.md },
        containerStyle,
      ]}
    >
      <AnimatedText style={[styles.label, textStyle]} selectable={false}>
        {label}
      </AnimatedText>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    height: 38,
    justifyContent: "center",
    alignItems: "center",
  },
  label: { fontSize: 10, fontWeight: "800" },
});
