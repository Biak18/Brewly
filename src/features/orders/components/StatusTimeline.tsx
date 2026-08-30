// src/features/orders/components/StatusTimeline.tsx
import { OrderStatus } from "@/services/orders";
import { useTheme } from "@/theme";
import { useTranslation } from "react-i18next";
import { Check } from "lucide-react-native";
import { useEffect } from "react";
import { Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const PICKUP_STEPS: OrderStatus[] = [
  "received",
  "preparing",
  "ready",
  "completed",
];
const DELIVERY_STEPS: OrderStatus[] = [
  "received",
  "preparing",
  "ready",
  "driver_assigned",
  "out_for_delivery",
  "delivered",
];

export function StatusTimeline({
  status,
  fulfillment,
}: {
  status: OrderStatus;
  fulfillment?: string;
}) {
  const { t } = useTranslation();
  const { colors, spacing, typography } = useTheme();
  const steps = fulfillment === "delivery" ? DELIVERY_STEPS : PICKUP_STEPS;
  const currentIndex = steps.indexOf(status);
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(currentIndex / (steps.length - 1), {
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
        {steps.map((step, index) => {
          const done = index <= currentIndex;
          return (
            <View key={step} style={{ alignItems: "center", width: 70 }}>
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
                {t(`tracking.status.${step}`)}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
