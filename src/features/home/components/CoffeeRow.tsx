// src/features/home/components/CoffeeRow.tsx
import { CoffeeCard } from "@/components/coffee/CoffeeCard";
import {
  useFavoriteIds,
  useToggleFavorite,
} from "@/features/favorites/api/useFavorites";
import { useActivePromotions } from "@/features/promotions/hooks/useActivePromotions";
import { useAddToCart } from "@/hooks/useAddToCart";
import { CoffeeWithStoreName } from "@/services/coffees";
import { useTheme } from "@/theme";
import { toCoffeeCardDataWithShop } from "@/utils/pricing";
import { useRouter } from "expo-router";
import { useCallback } from "react";
import { FlatList, ListRenderItem, Text, View } from "react-native";

type CoffeeRowProps = { title: string; coffees: CoffeeWithStoreName[] };

export function CoffeeRow({ title, coffees }: CoffeeRowProps) {
  const { colors, spacing, typography } = useTheme();
  const router = useRouter();
  const { data: favoriteIds } = useFavoriteIds();
  const toggleFavorite = useToggleFavorite();

  const addToCart = useAddToCart();

  const { data: promotions = [] } = useActivePromotions();

  const handlePress = useCallback(
    (id: string) => router.push(`/coffee/${id}`),
    [router],
  );
  const handleToggleFavorite = useCallback(
    (id: string) =>
      toggleFavorite.mutate({ coffeeId: id, liked: !favoriteIds?.has(id) }),
    [favoriteIds, toggleFavorite],
  );

  const handleAddToCart = useCallback(
    (id: string) => {
      const coffee = coffees.find((c) => c.id === id);
      if (!coffee) return;

      const card = toCoffeeCardDataWithShop(coffee, promotions);
      addToCart({
        coffeeId: coffee.id,
        storeId: coffee.store_id,
        name: coffee.name,
        imageUrl: coffee.image_url ?? "",
        unitPrice: card.price,
        compareAtUnitPrice: card.compareAtPrice,
      });
    },
    [coffees, promotions, addToCart],
  );

  const renderItem = useCallback<ListRenderItem<CoffeeWithStoreName>>(
    ({ item }) => {
      const data = toCoffeeCardDataWithShop(item, promotions);
      return (
        <CoffeeCard
          coffee={data}
          liked={favoriteIds?.has(item.id) ?? false}
          onPress={handlePress}
          onToggleFavorite={handleToggleFavorite}
          onAddToCart={handleAddToCart}
        />
      );
    },
    [
      favoriteIds,
      handlePress,
      handleToggleFavorite,
      handleAddToCart,
      promotions,
    ],
  );

  if (coffees.length === 0) return null;

  return (
    <View style={{ marginTop: spacing.xxl }}>
      <Text
        style={{
          color: colors.ink,
          fontSize: typography.subheading,
          fontWeight: "800",
          marginHorizontal: spacing.xl,
          marginBottom: spacing.md,
        }}
      >
        {title}
      </Text>
      <FlatList
        horizontal
        data={coffees}
        keyExtractor={(c) => c.id}
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
