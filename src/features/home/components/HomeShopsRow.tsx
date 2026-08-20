// src/features/home/components/HomeShopsRow.tsx
import { ShopCard } from "@/features/shops/components/ShopCard";
import { fetchStores, Store } from "@/services/stores";
import { useTheme } from "@/theme";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useCallback } from "react";
import { FlatList, ListRenderItem, Text, View } from "react-native";

export function HomeShopsRow() {
  const { colors, spacing, typography } = useTheme();
  const router = useRouter();
  const { data: stores = [] } = useQuery({
    queryKey: ["stores"],
    queryFn: fetchStores,
  });

  const handlePress = useCallback(
    (id: string) => router.push(`/shop/${id}`),
    [router],
  );
  const renderItem = useCallback<ListRenderItem<Store>>(
    ({ item }) => <ShopCard store={item} onPress={handlePress} layout="row" />,
    [handlePress],
  );

  if (stores.length === 0) return null;

  return (
    <View style={{ marginTop: 24 }}>
      <Text
        style={{
          color: colors.ink,
          fontSize: typography.subheading,
          fontWeight: "800",
          marginHorizontal: spacing.xl,
          marginBottom: spacing.md,
        }}
      >
        Shops
      </Text>
      <FlatList
        horizontal
        data={stores}
        keyExtractor={(s) => s.id}
        renderItem={renderItem}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          gap: spacing.md,
        }}
      />
    </View>
  );
}
