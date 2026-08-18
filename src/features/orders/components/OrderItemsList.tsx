// src/features/orders/components/OrderItemsList.tsx
import { OrderWithItems } from "@/services/orders";
import { useTheme } from "@/theme";
import { Text, View } from "react-native";

export function OrderItemsList({
  items,
}: {
  items: OrderWithItems["order_items"];
}) {
  const { colors, spacing, typography } = useTheme();
  return (
    <View style={{ gap: spacing.md }}>
      {items.map((item) => {
        const optionsSummary = [
          item.size,
          item.temperature,
          item.milk,
          ...(item.extras ?? []),
        ]
          .filter(Boolean)
          .join(" · ");
        return (
          <View
            key={item.id}
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: colors.ink,
                  fontWeight: "800",
                  fontSize: typography.bodySmall,
                }}
              >
                {item.quantity}× {item.coffees?.name ?? "Coffee"}
              </Text>
              {optionsSummary.length > 0 && (
                <Text
                  style={{
                    color: colors.muted,
                    fontSize: typography.micro,
                    marginTop: 2,
                  }}
                >
                  {optionsSummary}
                </Text>
              )}
            </View>
            <Text
              style={{
                color: colors.ink,
                fontSize: typography.bodySmall,
                fontWeight: "600",
              }}
            >
              ${(item.unit_price * item.quantity).toFixed(2)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
