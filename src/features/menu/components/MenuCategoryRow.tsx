// src/features/menu/components/MenuCategoryRow.tsx
import { Chip } from "@/components/ui/Chip";
import { Category, fetchCategories } from "@/services/coffees";
import { useTheme } from "@/theme";
import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";
import { FlatList, ListRenderItem } from "react-native";

const ALL_ITEM: Category = { id: "__all__", name: "All", sort_order: -1 };

export function MenuCategoryRow({
  selectedId,
  onSelect,
}: {
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const { spacing } = useTheme();
  // Same ['categories'] key as Home's CategoryRow — TanStack Query dedupes and
  // caches by key across components automatically, so this isn't a second network call.
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });
  const items = [ALL_ITEM, ...categories];

  const renderItem = useCallback<ListRenderItem<Category>>(
    ({ item }) => (
      <Chip
        label={item.name}
        active={
          item.id === "__all__" ? selectedId === null : selectedId === item.id
        }
        onPress={() => onSelect(item.id === "__all__" ? null : item.id)}
      />
    ),
    [selectedId, onSelect],
  );

  return (
    <FlatList
      horizontal
      style={{ height: 38 }}
      data={items}
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
