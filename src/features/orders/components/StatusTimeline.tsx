// src/features/orders/components/StatusTimeline.tsx
import { OrderStatus } from "@/services/orders";
import { useTheme } from "@/theme";
import { Check } from "lucide-react-native";
import { useEffect } from "react";
import { Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const STEPS: { key: OrderStatus; label: string }[] = [
  { key: "received", label: "Received" },
  { key: "preparing", label: "Preparing" },
  { key: "ready", label: "Ready" },
  { key: "completed", label: "Completed" },
];

// Simplification worth noting: the fill line and the step dots are laid out
// as two independent rows (line above, dots below via space-between), not a
// single connected line threading precisely through each dot's center. Good
// enough visually for 4 evenly-spaced steps; would need real coordinate math
// to hold up with a variable or dynamic number of steps.
export function StatusTimeline({ status }: { status: OrderStatus }) {
  const { colors, spacing, typography } = useTheme();
  const currentIndex = STEPS.findIndex((s) => s.key === status);
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(currentIndex / (STEPS.length - 1), {
      duration: 500,
    });
  }, [currentIndex, progress]);

  const lineStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <View>
      <View
        style={{
          height: 4,
          borderRadius: 2,
          backgroundColor: colors.line,
          marginHorizontal: spacing.xl,
          overflow: "hidden",
        }}
      >
        <Animated.View
          style={[
            { height: 4, backgroundColor: colors.green, borderRadius: 2 },
            lineStyle,
          ]}
        />
      </View>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          paddingHorizontal: spacing.lg,
          marginTop: spacing.md,
        }}
      >
        {STEPS.map((step, index) => {
          const done = index <= currentIndex;
          return (
            <View key={step.key} style={{ alignItems: "center", width: 70 }}>
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: done ? colors.green : colors.surface2,
                }}
              >
                {done && <Check size={14} color="#fff" strokeWidth={3} />}
              </View>
              <Text
                style={{
                  color: done ? colors.ink : colors.muted,
                  fontSize: typography.micro,
                  marginTop: 6,
                  fontWeight: done ? "800" : "500",
                  textAlign: "center",
                }}
              >
                {step.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
