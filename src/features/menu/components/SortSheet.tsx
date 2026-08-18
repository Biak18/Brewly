// src/features/menu/components/SortSheet.tsx
import { MenuSort } from "@/services/coffees";
import { useTheme } from "@/theme";
import * as Haptics from "expo-haptics";
import { Check } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

const SORT_OPTIONS: { value: MenuSort; label: string }[] = [
  { value: "popular", label: "Popular" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "name", label: "Name" },
];

export function SortSheet({
  value,
  onChange,
}: {
  value: MenuSort;
  onChange: (s: MenuSort) => void;
}) {
  const { colors, spacing, typography } = useTheme();
  return (
    <View style={{ paddingHorizontal: spacing.xl }}>
      <Text
        style={{
          color: colors.ink,
          fontSize: typography.subheading,
          fontWeight: "800",
          marginBottom: spacing.md,
        }}
      >
        Sort by
      </Text>
      {SORT_OPTIONS.map((opt) => {
        const active = value === opt.value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => {
              Haptics.selectionAsync();
              onChange(opt.value);
            }}
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingVertical: 14,
              borderBottomWidth: 1,
              borderBottomColor: colors.line,
            }}
          >
            <Text
              style={{
                color: active ? colors.espresso : colors.ink,
                fontWeight: active ? "800" : "500",
                fontSize: typography.body,
              }}
            >
              {opt.label}
            </Text>
            {active && (
              <Check size={18} color={colors.espresso} strokeWidth={2} />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}
