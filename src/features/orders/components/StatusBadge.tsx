// src/features/orders/components/StatusBadge.tsx
import { OrderStatus } from "@/services/orders";
import { useTheme } from "@/theme";
import { Text, View } from "react-native";

const TONE: Record<OrderStatus, "active" | "ready" | "done"> = {
  received: "active",
  preparing: "active",
  ready: "ready",
  completed: "done",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  const { colors, radius, typography } = useTheme();
  const tone = TONE[status];
  const bg =
    tone === "ready"
      ? colors.greenSoft
      : tone === "done"
        ? colors.surface2
        : colors.cream;
  const fg =
    tone === "ready"
      ? colors.green
      : tone === "done"
        ? colors.muted
        : colors.espresso;
  return (
    <View
      style={{
        backgroundColor: bg,
        borderRadius: radius.pill,
        paddingHorizontal: 10,
        paddingVertical: 4,
      }}
    >
      <Text
        style={{
          color: fg,
          fontSize: typography.micro,
          fontWeight: "800",
          textTransform: "capitalize",
        }}
      >
        {status}
      </Text>
    </View>
  );
}
