// src/features/seller/components/OptionRow.tsx
import { SellerOption } from "@/services/sellerOptions";
import { useTheme } from "@/theme";
import { formatCurrency } from "@/utils/currency";
import { useCallback } from "react";
import { Pressable, Text, View } from "react-native";

type OptionRowProps = {
  option: SellerOption;
  categoryCount: number;
  onPress: (option: SellerOption) => void;
};

export function OptionRow({ option, categoryCount, onPress }: OptionRowProps) {
  const { colors, radius, spacing, typography } = useTheme();
  const handlePress = useCallback(() => onPress(option), [onPress, option]);
  const scopeLabel =
    option.categoryIds.length === 0
      ? "All categories"
      : `${option.categoryIds.length} of ${categoryCount} categories`;

  return (
    <Pressable
      onPress={handlePress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: spacing.md,
        backgroundColor: colors.surface,
        borderColor: colors.line,
        borderWidth: 1,
        borderRadius: radius.lg,
        marginBottom: spacing.sm,
      }}
    >
      <View style={{ flex: 1 }}>
        <Text
          style={{
            color: colors.ink,
            fontWeight: "800",
            fontSize: typography.bodySmall,
          }}
        >
          {option.label}
        </Text>
        <Text
          style={{
            color: colors.muted,
            fontSize: typography.micro,
            marginTop: 2,
          }}
        >
          {scopeLabel}
        </Text>
      </View>
      <Text
        style={{
          color: colors.ink,
          fontWeight: "700",
          fontSize: typography.bodySmall,
        }}
      >
        {option.price_delta > 0
          ? `+${formatCurrency(option.price_delta)}`
          : "Free"}
      </Text>
    </Pressable>
  );
}
