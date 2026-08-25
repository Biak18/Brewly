// src/features/checkout/components/OrderSummary.tsx
import { computeOrderTotals } from "@/services/orders";
import { CartLineItem, computeCartSavings } from "@/stores/cartStore";
import { useTheme } from "@/theme";
import { Text, View } from "react-native";

function Row({
  label,
  value,
  bold,
  color,
}: {
  label: string;
  value: string;
  bold?: boolean;
  color?: string;
}) {
  const { colors, spacing, typography } = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: spacing.xs,
      }}
    >
      <Text
        style={{
          color: color ?? (bold ? colors.ink : colors.muted),
          fontWeight: bold ? "800" : "500",
          fontSize: typography.bodySmall,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          color: color ?? colors.ink,
          fontWeight: bold ? "800" : "500",
          fontSize: typography.bodySmall,
        }}
      >
        {value}
      </Text>
    </View>
  );
}

export function OrderSummary({
  items,
  tip = 0,
  discount = 0,
  fee = 0,
}: {
  items: CartLineItem[];
  tip?: number;
  discount?: number;
  fee?: number;
}) {
  const { colors, spacing, radius } = useTheme();
  const { subtotal, tax, total } = computeOrderTotals(items);
  const savings = computeCartSavings(items);
  const grandTotal =
    Math.round((total - Math.min(discount, total) + tip + fee) * 100) / 100;

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
      {savings > 0 && (
        <Row
          label="Savings"
          value={`-$${savings.toFixed(2)}`}
          color={colors.green}
        />
      )}
      {discount > 0 && (
        <Row
          label="Discounts"
          value={`-$${Math.min(discount, total).toFixed(2)}`}
          color={colors.green}
        />
      )}
      {fee > 0 && <Row label="Delivery fee" value={`$${fee.toFixed(2)}`} />}
      {tip > 0 && <Row label="Tip" value={`$${tip.toFixed(2)}`} />}
      <View
        style={{
          height: 1,
          backgroundColor: colors.line,
          marginVertical: spacing.sm,
        }}
      />
      <Row label="Total" value={`$${grandTotal.toFixed(2)}`} bold />
    </View>
  );
}
