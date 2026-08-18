// src/features/checkout/components/StoreSelect.tsx
import { fetchStores } from "@/services/stores";
import { useTheme } from "@/theme";
import { useQuery } from "@tanstack/react-query";
import { Check, MapPin } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

export function StoreSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  const { colors, radius, spacing, typography } = useTheme();
  const { data: stores = [] } = useQuery({
    queryKey: ["stores"],
    queryFn: fetchStores,
  });

  return (
    <View style={{ gap: spacing.sm }}>
      {stores.map((store) => {
        const active = value === store.id;
        return (
          <Pressable
            key={store.id}
            onPress={() => onChange(store.id)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              padding: spacing.md,
              borderRadius: radius.lg,
              borderWidth: 1,
              borderColor: active ? colors.espresso : colors.line,
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
            {active && (
              <Check size={18} color={colors.espresso} strokeWidth={2} />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}
