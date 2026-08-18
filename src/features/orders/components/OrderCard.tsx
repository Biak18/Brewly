// src/features/orders/components/OrderCard.tsx
import { CoffeeImage } from "@/components/coffee/CoffeeImage";
import { OrderStatus } from "@/services/orders";
import { useTheme } from "@/theme";
import { memo, useCallback } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { StatusBadge } from "./StatusBadge";

export type OrderCardData = {
  id: string;
  status: OrderStatus;
  total: number;
  placedAt: string;
  itemCount: number;
  thumbnailUrl: string | null;
};

type OrderCardProps = {
  order: OrderCardData;
  onPress: (id: string) => void;
  layout?: "row" | "list";
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function OrderCardComponent({
  order,
  onPress,
  layout = "list",
}: OrderCardProps) {
  const { colors, radius, spacing, typography } = useTheme();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const handlePress = useCallback(() => onPress(order.id), [onPress, order.id]);

  const dateLabel = new Date(order.placedAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  const itemsLabel = `${order.itemCount} item${order.itemCount === 1 ? "" : "s"}`;

  const shared = {
    accessibilityRole: "button" as const,
    accessibilityLabel: `Order, ${itemsLabel}, $${order.total.toFixed(2)}, ${order.status}`,
    onPress: handlePress,
    onPressIn: () => {
      scale.value = withSpring(0.97);
    },
    onPressOut: () => {
      scale.value = withSpring(1);
    },
  };

  if (layout === "row") {
    return (
      <AnimatedPressable
        {...shared}
        style={[
          styles.rowCard,
          {
            borderColor: colors.line,
            backgroundColor: colors.surface,
            borderRadius: radius.xl,
          },
          animatedStyle,
        ]}
      >
        <CoffeeImage
          uri={order.thumbnailUrl ?? ""}
          height={96}
          radius={radius.xl}
        />
        <View style={{ padding: spacing.sm }}>
          <Text
            style={{
              color: colors.ink,
              fontWeight: "800",
              fontSize: typography.bodySmall,
            }}
            numberOfLines={1}
          >
            {itemsLabel}
          </Text>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 4,
            }}
          >
            <Text
              style={{
                color: colors.ink,
                fontWeight: "800",
                fontSize: typography.caption,
              }}
            >
              ${order.total.toFixed(2)}
            </Text>
            <StatusBadge status={order.status} />
          </View>
        </View>
      </AnimatedPressable>
    );
  }

  return (
    <AnimatedPressable
      {...shared}
      style={[
        styles.listCard,
        {
          borderColor: colors.line,
          backgroundColor: colors.surface,
          borderRadius: radius.xl,
        },
        animatedStyle,
      ]}
    >
      <View style={{ width: 96 }}>
        <CoffeeImage
          uri={order.thumbnailUrl ?? ""}
          height={96}
          radius={radius.lg}
        />
      </View>
      <View style={{ flex: 1, marginLeft: spacing.md }}>
        <Text
          style={{
            color: colors.ink,
            fontWeight: "800",
            fontSize: typography.bodySmall,
          }}
        >
          {itemsLabel} · ${order.total.toFixed(2)}
        </Text>
        <Text
          style={{
            color: colors.muted,
            fontSize: typography.micro,
            marginTop: 2,
          }}
        >
          {dateLabel}
        </Text>
      </View>
      <StatusBadge status={order.status} />
    </AnimatedPressable>
  );
}

export const OrderCard = memo(
  OrderCardComponent,
  (prev, next) =>
    prev.order.id === next.order.id &&
    prev.order.status === next.order.status &&
    prev.order.total === next.order.total,
);

const styles = StyleSheet.create({
  rowCard: { width: 150, borderWidth: 1, overflow: "hidden" },
  listCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    padding: 10,
    marginBottom: 12,
  },
});
