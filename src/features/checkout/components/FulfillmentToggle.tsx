// src/features/checkout/components/FulfillmentToggle.tsx
import { useTheme } from "@/theme";
import { Text, View } from "react-native";

export function FulfillmentToggle() {
  const { colors, radius, spacing, typography } = useTheme();
  return (
    <View style={{ flexDirection: "row", gap: spacing.sm }}>
      <View
        style={{
          flex: 1,
          height: 44,
          borderRadius: radius.md,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.espresso,
        }}
      >
        <Text
          style={{
            color: colors.surface,
            fontWeight: "800",
            fontSize: typography.bodySmall,
          }}
        >
          Pickup
        </Text>
      </View>
      <View
        style={{
          flex: 1,
          height: 44,
          borderRadius: radius.md,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.surface2,
          opacity: 0.5,
        }}
      >
        <Text
          style={{
            color: colors.muted,
            fontWeight: "800",
            fontSize: typography.bodySmall,
          }}
        >
          Delivery · Soon
        </Text>
      </View>
    </View>
  );
}
