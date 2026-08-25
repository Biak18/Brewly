// src/features/checkout/components/DeliveryAddressPicker.tsx
import { Address } from "@/features/account/hooks/useAddresses";
import { useTheme } from "@/theme";
import { Check, MapPin, Plus } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

export function DeliveryAddressPicker({
  addresses,
  selectedId,
  onSelect,
  onManage,
}: {
  addresses: Address[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onManage: () => void;
}) {
  const { colors, radius, spacing, typography } = useTheme();

  if (addresses.length === 0) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={onManage}
        style={{
          flexDirection: "row",
          alignItems: "center",
          padding: spacing.md,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.danger,
          backgroundColor: colors.surface,
          gap: spacing.sm,
        }}
      >
        <MapPin size={16} color={colors.danger} strokeWidth={1.8} />
        <Text
          style={{
            color: colors.danger,
            fontSize: typography.caption,
            fontWeight: "600",
            flex: 1,
          }}
        >
          You need a delivery address to continue.
        </Text>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
            backgroundColor: colors.espresso,
            borderRadius: radius.md,
            paddingHorizontal: spacing.sm,
            paddingVertical: spacing.xs + 2,
          }}
        >
          <Plus size={12} color={colors.surface} strokeWidth={2.4} />
          <Text style={{ color: colors.surface, fontSize: typography.micro, fontWeight: "800" }}>
            Add
          </Text>
        </View>
      </Pressable>
    );
  }

  return (
    <View style={{ gap: spacing.sm }}>
      {addresses.map((a) => {
        const active = a.id === selectedId;
        return (
          <Pressable
            key={a.id}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            onPress={() => onSelect(a.id)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              padding: spacing.md,
              borderRadius: radius.lg,
              borderWidth: 1,
              borderColor: active ? colors.espresso : colors.line,
              backgroundColor: colors.surface,
              gap: spacing.sm,
            }}
          >
            <View style={{ flex: 1 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: spacing.sm,
                }}
              >
                <Text
                  style={{
                    color: colors.ink,
                    fontWeight: "800",
                    fontSize: typography.bodySmall,
                  }}
                >
                  {a.label}
                </Text>
                {a.is_default && (
                  <Text
                    style={{ color: colors.green, fontSize: typography.micro, fontWeight: "800" }}
                  >
                    Default
                  </Text>
                )}
              </View>
              <Text
                style={{ color: colors.muted, fontSize: typography.caption, marginTop: 2 }}
                numberOfLines={1}
              >
                {a.address}
              </Text>
            </View>
            {active && <Check size={18} color={colors.espresso} strokeWidth={2.4} />}
          </Pressable>
        );
      })}
      <Pressable onPress={onManage} hitSlop={8} style={{ alignSelf: "flex-end" }}>
        <Text style={{ color: colors.espresso2, fontSize: typography.caption, fontWeight: "700" }}>
          Manage addresses
        </Text>
      </Pressable>
    </View>
  );
}
