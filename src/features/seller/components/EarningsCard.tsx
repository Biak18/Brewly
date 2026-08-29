// src/features/seller/components/EarningsCard.tsx
import { Pulse } from "@/components/ui/Pulse";
import { formatCurrency } from "@/utils/currency";
import { useTheme } from "@/theme";
import { SellerEarnings } from "@/services/sellerEarnings";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

type StatCell = { label: string; value: string };

export function EarningsCard({ earnings }: { earnings: SellerEarnings }) {
  const { colors, spacing, radius, typography } = useTheme();

  const cells = useMemo<StatCell[]>(
    () => [
      { label: "Today", value: formatCurrency(earnings.today) },
      { label: "Last 7 days", value: formatCurrency(earnings.week) },
      { label: "Last 30 days", value: formatCurrency(earnings.month) },
      { label: "Avg order (30d)", value: formatCurrency(earnings.avgOrder) },
    ],
    [earnings.today, earnings.week, earnings.month, earnings.avgOrder],
  );

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderColor: colors.line,
        borderWidth: 1,
        borderRadius: radius.xl,
        padding: spacing.lg,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: spacing.md,
        }}
      >
        <Text
          style={{
            color: colors.ink,
            fontSize: typography.body,
            fontWeight: "800",
          }}
        >
          Sales summary
        </Text>
        {earnings.openOrders > 0 && (
          <View
            style={{
              backgroundColor: colors.espresso,
              borderRadius: radius.pill,
              paddingHorizontal: spacing.sm,
              paddingVertical: 3,
            }}
          >
            <Text
              style={{
                color: colors.surface,
                fontSize: typography.micro,
                fontWeight: "800",
              }}
            >
              {earnings.openOrders} open
            </Text>
          </View>
        )}
      </View>

      <View style={styles.grid}>
        {cells.map((cell) => (
          <View
            key={cell.label}
            style={[styles.cell, { borderColor: colors.line }]}
          >
            <Text
              style={{
                color: colors.muted,
                fontSize: typography.micro,
                fontWeight: "600",
              }}
            >
              {cell.label}
            </Text>
            <Text
              style={{
                color: colors.ink,
                fontSize: typography.body,
                fontWeight: "800",
                marginTop: 2,
              }}
              numberOfLines={1}
            >
              {cell.value}
            </Text>
          </View>
        ))}
      </View>

      <Text
        style={{
          color: colors.muted,
          fontSize: typography.micro,
          fontWeight: "600",
          marginTop: spacing.md,
        }}
      >
        {earnings.completedCount} completed all-time
      </Text>
    </View>
  );
}

export function EarningsCardSkeleton() {
  return <Pulse style={{ height: 180 }} />;
}

export function EarningsCardError() {
  const { colors, spacing, radius, typography } = useTheme();
  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderColor: colors.line,
        borderWidth: 1,
        borderRadius: radius.xl,
        padding: spacing.lg,
      }}
    >
      <Text
        style={{
          color: colors.muted,
          fontSize: typography.bodySmall,
          fontWeight: "600",
        }}
      >
        Could not load sales summary.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -6,
    marginBottom: -6,
  },
  cell: {
    width: "50%",
    paddingHorizontal: 6,
    marginBottom: 6,
  },
});
