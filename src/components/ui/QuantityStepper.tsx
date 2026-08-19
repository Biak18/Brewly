// src/features/coffee/components/QuantityStepper.tsx
import { useTheme } from "@/theme";
import * as Haptics from "expo-haptics";
import { Minus, Plus } from "lucide-react-native";
import { useEffect } from "react";
import { Pressable, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from "react-native-reanimated";

type QuantityStepperProps = {
  value: number;
  onChange: (v: number) => void;
  max?: number;
};

export function QuantityStepper({
  value,
  onChange,
  max = 20,
}: QuantityStepperProps) {
  const { colors, radius, spacing, typography } = useTheme();
  const bump = useSharedValue(1);

  useEffect(() => {
    bump.value = withSequence(
      withSpring(1.2, { damping: 6 }),
      withSpring(1, { damping: 8 }),
    );
  }, [value, bump]);

  const numberStyle = useAnimatedStyle(() => ({
    transform: [{ scale: bump.value }],
  }));

  const atMax = value >= max;

  return (
    <View
      style={{ flexDirection: "row", alignItems: "center", gap: spacing.lg }}
    >
      <Pressable
        onPress={() => {
          if (value > 1) {
            Haptics.selectionAsync();
            onChange(value - 1);
          }
        }}
        disabled={value <= 1}
        hitSlop={8}
        style={{
          width: 32,
          height: 32,
          borderRadius: radius.sm,
          borderWidth: 1,
          borderColor: colors.line,
          alignItems: "center",
          justifyContent: "center",
          opacity: value <= 1 ? 0.4 : 1,
        }}
      >
        <Minus size={16} color={colors.ink} strokeWidth={2} />
      </Pressable>
      <Animated.Text
        style={[
          {
            color: colors.ink,
            fontSize: typography.subheading,
            fontWeight: "800",
            minWidth: 20,
            textAlign: "center",
          },
          numberStyle,
        ]}
      >
        {value}
      </Animated.Text>
      <Pressable
        onPress={() => {
          if (!atMax) {
            Haptics.selectionAsync();
            onChange(value + 1);
          }
        }}
        disabled={atMax}
        hitSlop={8}
        style={{
          width: 32,
          height: 32,
          borderRadius: radius.sm,
          backgroundColor: colors.espresso,
          alignItems: "center",
          justifyContent: "center",
          opacity: atMax ? 0.4 : 1,
        }}
      >
        <Plus size={16} color={colors.surface} strokeWidth={2} />
      </Pressable>
    </View>
  );
}
