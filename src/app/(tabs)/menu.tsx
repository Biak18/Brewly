// src/app/(tabs)/menu.tsx
import { CoffeeCard } from "@/components/coffee/CoffeeCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pulse } from "@/components/ui/Pulse";
import {
  useFavoriteIds,
  useToggleFavorite,
} from "@/features/favorites/api/useFavorites";
import { MenuCategoryRow } from "@/features/menu/components/MenuCategoryRow";
import MenuContent from "@/features/menu/components/MenuContent";
import { MenuSkeleton } from "@/features/menu/components/MenuSkeleton";
import { SearchBar } from "@/features/menu/components/SearchBar";
import { useMenuCoffees } from "@/features/menu/hooks/useMenuCoffees";
import { useActivePromotions } from "@/features/promotions/hooks/useActivePromotions";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { MenuSort } from "@/services/coffees";
import { useCartStore } from "@/stores/cartStore";
import { useUIStore } from "@/stores/uiStore";
import { useTheme } from "@/theme";
import { getCoffeePricing, toCoffeeCardData } from "@/utils/pricing";
import { FlashList } from "@shopify/flash-list";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Coffee as CoffeeIcon } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function MenuScreen() {
  const { colors, spacing } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string }>();
  const openCartPreview = useUIStore((s) => s.openCartPreview);

  const [categoryId, setCategoryId] = useState<string | null>(
    params.category ?? null,
  );
  const [searchText, setSearchText] = useState("");
  const [sort, setSort] = useState<MenuSort>("popular");
  const debouncedSearch = useDebouncedValue(searchText, 300);
  const { data: promotions = [] } = useActivePromotions();
  useEffect(() => {
    if (params.category !== undefined) setCategoryId(params.category);
  }, [params.category]);

  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useMenuCoffees(categoryId, debouncedSearch, sort);
  const coffees = useMemo(() => data?.pages.flat() ?? [], [data]);

  const { data: favoriteIds } = useFavoriteIds();
  const toggleFavorite = useToggleFavorite();
  const addItem = useCartStore((s) => s.addItem);

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
      const { unitPrice, compareAtUnitPrice } = getCoffeePricing(
        coffee,
        promotions,
      );
      addItem({
        coffeeId: coffee.id,
        name: coffee.name,
        imageUrl: coffee.image_url ?? "",
        unitPrice,
        compareAtUnitPrice,
      });
    },
    [coffees, addItem, promotions],
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.sm,
          paddingHorizontal: spacing.xl,
        }}
      >
        <SearchBar value={searchText} onChangeText={setSearchText} />

        <MenuContent value={sort} onChange={setSort} />
      </View>

      <View>
        <View style={{ height: spacing.md }} />
        <MenuCategoryRow selectedId={categoryId} onSelect={setCategoryId} />
        <View style={{ height: spacing.sm }} />
        <View style={{ height: spacing.md }} />
      </View>

      {isLoading ? (
        <MenuSkeleton />
      ) : isError ? (
        <EmptyState
          icon={
            <CoffeeIcon size={28} color={colors.espresso} strokeWidth={1.8} />
          }
          title="Couldn't load the menu"
          description="Check your connection and try again."
          actionLabel="Retry"
          onAction={() => refetch()}
        />
      ) : coffees.length === 0 ? (
        <EmptyState
          icon={
            <CoffeeIcon size={28} color={colors.espresso} strokeWidth={1.8} />
          }
          title="No coffee found"
          description={
            debouncedSearch
              ? `Nothing matches "${debouncedSearch}".`
              : "Try a different category."
          }
        />
      ) : (
        <FlashList
          data={coffees}
          numColumns={2}
          keyExtractor={(item) => item.id}
          onEndReachedThreshold={0.5}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) fetchNextPage();
          }}
          ListFooterComponent={
            isFetchingNextPage ? (
              <Pulse style={{ height: 60, margin: spacing.md }} />
            ) : null
          }
          contentContainerStyle={{
            paddingHorizontal: spacing.lg,
            paddingBottom: spacing.xxxl,
          }}
          renderItem={({ item }) => {
            const data = toCoffeeCardData(item, promotions);
            return (
              <View style={{ flex: 1, margin: spacing.xs }}>
                <CoffeeCard
                  coffee={data}
                  layout="grid"
                  liked={favoriteIds?.has(item.id) ?? false}
                  onPress={handlePress}
                  onToggleFavorite={handleToggleFavorite}
                  onAddToCart={handleAddToCart}
                />
              </View>
            );
          }}
        />
      )}

      {/* <BottomSheet
        visible={sortSheetVisible}
        onClose={() => setSortSheetVisible(false)}
      >
        <SortSheet
          value={sort}
          onChange={(s) => {
            setSort(s);
            setSortSheetVisible(false);
          }}
        />
      </BottomSheet> */}
    </SafeAreaView>
  );
}
