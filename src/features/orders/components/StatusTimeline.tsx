// src/features/orders/components/StatusTimeline.tsx
import { OrderStatus } from "@/services/orders";
import { useTheme } from "@/theme";
import { Check } from "lucide-react-native";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
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
  "completed",
];

const DOT_SIZE = 24;

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
  // Guards against status not matching this fulfillment's step list (shouldn't
  // happen given how orders are created, but indexOf returning -1 would
  // otherwise drive a negative-width animated style below).
  const currentIndex = Math.max(0, steps.indexOf(status));
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(currentIndex / (steps.length - 1), {
      duration: 500,
    });
  }, [currentIndex, steps.length, progress]);

  const lineStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <View style={{ marginHorizontal: spacing.xl }}>
      {/* Both the line and the dot row live inside one DOT_SIZE-tall container now,
        instead of being two stacked, independently-heighted elements. */}
      <View style={{ height: DOT_SIZE }}>
        <View
          style={{
            position: "absolute",
            top: (DOT_SIZE - 4) / 2, // centers the 4px line on the 24px dot's vertical midpoint
            left: 0,
            right: 0,
            height: 4,
            borderRadius: 2,
            backgroundColor: colors.line,
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

        {/* Rendered second in the same parent — normal-flow siblings paint over
          earlier absolutely-positioned ones by default in RN, no zIndex needed.
          This is what makes the dots visually sit "on top of" the line rather
          than the line cutting across them. */}
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          {steps.map((step, index) => {
            const done = index <= currentIndex;
            return (
              <View
                key={step}
                style={{
                  width: DOT_SIZE,
                  height: DOT_SIZE,
                  borderRadius: DOT_SIZE / 2,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: done ? colors.green : colors.surface2,
                }}
              >
                {done && <Check size={14} color="#fff" strokeWidth={3} />}
              </View>
            );
          })}
        </View>
      </View>

      <Text
        style={{
          color: colors.ink,
          fontSize: typography.body,
          fontWeight: "800",
          textAlign: "center",
          marginTop: spacing.md,
        }}
      >
        {t(`tracking.status.${steps[currentIndex]}`)}
      </Text>
    </View>
  );
}
