// src/features/home/components/CategoryRow.tsx
import { Chip } from "@/components/ui/Chip";
import { Category, fetchCategories } from "@/services/coffees";
import { useTheme } from "@/theme";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useCallback } from "react";
import { FlatList, ListRenderItem } from "react-native";

// Chip.active is always false here — Home doesn't own filter state, it navigates
// away to Menu on tap. Selected-state chips belong to Menu, where filtering happens.
export function CategoryRow() {
  const { spacing } = useTheme();
  const router = useRouter();
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  const renderItem = useCallback<ListRenderItem<Category>>(
    ({ item }) => (
      <Chip
        label={item.name}
        active={false}
        onPress={() =>
          router.push({
            pathname: "/(tabs)/menu",
            params: { category: item.id },
          })
        }
      />
    ),
    [router],
  );

  return (
    <FlatList
      horizontal
      data={categories}
      keyExtractor={(c) => c.id}
      renderItem={renderItem}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        paddingHorizontal: spacing.xl,
        gap: spacing.sm,
        height: 38,
        maxHeight: 38,
      }}
    />
  );
}
