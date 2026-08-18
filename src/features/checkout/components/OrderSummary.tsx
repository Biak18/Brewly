// src/features/checkout/components/OrderSummary.tsx
import { computeOrderTotals } from "@/services/orders";
import { CartLineItem, computeCartSavings } from "@/stores/cartStore";
import { useTheme } from "@/theme";
import { Text, View } from "react-native";

export function OrderSummary({ items }: { items: CartLineItem[] }) {
  const { colors, spacing, radius, typography } = useTheme();
  const { subtotal, tax, total } = computeOrderTotals(items);
  const savings = computeCartSavings(items);

  const Row = ({
    label,
    value,
    bold,
  }: {
    label: string;
    value: string;
    bold?: boolean;
  }) => (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: spacing.xs,
      }}
    >
      <Text
        style={{
          color: bold ? colors.ink : colors.muted,
          fontWeight: bold ? "800" : "500",
          fontSize: typography.bodySmall,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          color: colors.ink,
          fontWeight: bold ? "800" : "500",
          fontSize: typography.bodySmall,
        }}
      >
        {value}
      </Text>
    </View>
  );

  return (
    <View
      style={{
        padding: spacing.md,
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.line,
      }}
    >
      <Row
        label={`${items.length} item${items.length === 1 ? "" : "s"}`}
        value={`$${subtotal.toFixed(2)}`}
      />
      <Row label="Tax" value={`$${tax.toFixed(2)}`} />
      {savings > 0 && <Row label="Savings" value={`-$${savings.toFixed(2)}`} />}
      <View
        style={{
          height: 1,
          backgroundColor: colors.line,
          marginVertical: spacing.sm,
        }}
      />
      <Row label="Total" value={`$${total.toFixed(2)}`} bold />
    </View>
  );
}
