// src/features/checkout/components/PickupStoreDisplay.tsx
import { Store } from "@/services/stores";
import { useTheme } from "@/theme";
import { MapPin } from "lucide-react-native";
import { Text, View } from "react-native";

export function PickupStoreDisplay({ store }: { store: Store | undefined }) {
  const { colors, radius, spacing, typography } = useTheme();
  if (!store) return null;
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        padding: spacing.md,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.line,
        backgroundColor: colors.surface,
      }}
    >
      <MapPin size={16} color={colors.muted} strokeWidth={1.8} />
      <View style={{ flex: 1, marginLeft: spacing.sm }}>
        <Text
          style={{
            color: colors.ink,
            fontWeight: "800",
            fontSize: typography.bodySmall,
          }}
        >
          {store.name}
        </Text>
        <Text
          style={{
            color: colors.muted,
            fontSize: typography.caption,
            marginTop: 2,
          }}
          numberOfLines={1}
        >
          {store.address}
        </Text>
      </View>
    </View>
  );
}
