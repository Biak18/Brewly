// src/features/checkout/components/FulfillmentToggle.tsx
import { useTheme } from "@/theme";
import * as Haptics from "expo-haptics";
import { Bike, Store } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

export function FulfillmentToggle({
  value,
  onChange,
}: {
  value: "pickup" | "delivery";
  onChange: (v: "pickup" | "delivery") => void;
}) {
  const { colors, radius, spacing, typography } = useTheme();
  const options = [
    {
      key: "pickup" as const,
      label: "Pickup",
      icon: <Store size={16} color={colors.espresso} strokeWidth={1.8} />,
    },
    {
      key: "delivery" as const,
      label: "Delivery",
      icon: <Bike size={16} color={colors.surface} strokeWidth={1.8} />,
    },
  ];

  return (
    <View style={{ flexDirection: "row", gap: spacing.sm }}>
      {options.map((opt) => {
        const active = value === opt.key;
        return (
          <Pressable
            key={opt.key}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => {
              if (!active) {
                Haptics.selectionAsync();
                onChange(opt.key);
              }
            }}
            style={{
              flex: 1,
              height: 44,
              borderRadius: radius.md,
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
              gap: spacing.xs,
              backgroundColor: active ? colors.espresso : colors.surface2,
              opacity: active ? 1 : 0.7,
            }}
          >
            {active ? opt.icon : null}
            <Text
              style={{
                color: active ? colors.surface : colors.muted,
                fontWeight: "800",
                fontSize: typography.bodySmall,
              }}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
