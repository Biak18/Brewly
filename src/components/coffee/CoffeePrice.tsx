// src/components/coffee/CoffeePrice.tsx — full replacement
import { useTheme } from "@/theme";
import { formatCurrency } from "@/utils/currency";
import { StyleSheet, Text, View } from "react-native";

type CoffeePriceProps = {
  value: number;
  compareAtValue?: number;
  size?: number;
  /**
   * Stacks the compare-at price under the current price instead of inline.
   * Use in tight horizontal layouts (e.g. the detail footer) so a long
   * "8,800 Ks 11,000 Ks" pair can't push siblings off screen.
   */
  stacked?: boolean;
};

export function CoffeePrice({
  value,
  compareAtValue,
  size = 14,
  stacked = false,
}: CoffeePriceProps) {
  const { colors } = useTheme();
  const hasDiscount = compareAtValue != null && compareAtValue > value;

  if (!hasDiscount) {
    return (
      <Text
        style={[styles.price, { color: colors.ink, fontSize: size }]}
        selectable
      >
        {formatCurrency(value)}
      </Text>
    );
  }

  if (stacked) {
    return (
      <View>
        <Text
          style={[styles.price, { color: colors.danger, fontSize: size }]}
          selectable
        >
          {formatCurrency(value)}
        </Text>
        <Text
          style={{
            color: colors.muted,
            fontSize: size * 0.65,
            textDecorationLine: "line-through",
            marginTop: 2,
          }}
          selectable
        >
          {formatCurrency(compareAtValue!)}
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6 }}>
      <Text
        style={[styles.price, { color: colors.danger, fontSize: size }]}
        selectable
      >
        {formatCurrency(value)}
      </Text>
      <Text
        style={{
          color: colors.muted,
          fontSize: size * 0.75,
          textDecorationLine: "line-through",
        }}
        selectable
      >
        {formatCurrency(compareAtValue!)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  price: {
    fontWeight: "800",
    letterSpacing: -0.3,
    fontVariant: ["tabular-nums"],
  },
});
