// src/app/shop/[id].tsx
import { CoffeeCard } from "@/components/coffee/CoffeeCard";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { EmptyState } from "@/components/ui/EmptyState";
import { IconButton } from "@/components/ui/IconButton";
import { Pulse } from "@/components/ui/Pulse";
import {
  useFavoriteIds,
  useToggleFavorite,
} from "@/features/favorites/api/useFavorites";
import { MenuCategoryRow } from "@/features/menu/components/MenuCategoryRow";
import { MenuSkeleton } from "@/features/menu/components/MenuSkeleton";
import { SearchBar } from "@/features/menu/components/SearchBar";
import { SortSheet } from "@/features/menu/components/SortSheet";
import { useMenuCoffees } from "@/features/menu/hooks/useMenuCoffees";
import { useActivePromotions } from "@/features/promotions/hooks/useActivePromotions";
import { useAddToCart } from "@/hooks/useAddToCart";
import { useCartAwareBottomInset } from "@/hooks/useCartAwareBottomInset";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { MenuSort } from "@/services/coffees";
import { fetchStoreById } from "@/services/stores";
import { track } from "@/lib/analytics";
import { useTheme } from "@/theme";
import { toCoffeeCardData } from "@/utils/pricing";
import { Stagger } from "@animatereactnative/stagger";
import { AnimatedFlashList } from "@shopify/flash-list";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ChevronLeft,
  Coffee as CoffeeIcon,
  SlidersHorizontal,
} from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Text, View } from "react-native";
import Animated, {
  Easing,
  FadeInUp,
  ZoomInEasyDown,
} from "react-native-reanimated";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

export default function ShopMenuScreen() {
  const { id: storeId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, spacing, typography } = useTheme();
  const bottomInset = useCartAwareBottomInset();

  useEffect(() => {
    if (storeId) track("shop_viewed", { store_id: storeId });
  }, [storeId]);

  const { data: store } = useQuery({
    queryKey: ["store", storeId],
    queryFn: () => fetchStoreById(storeId),
  });

  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [sort, setSort] = useState<MenuSort>("popular");
  const [sortSheetVisible, setSortSheetVisible] = useState(false);
  const debouncedSearch = useDebouncedValue(searchText, 300);

  const promotions = useActivePromotions(storeId);
  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useMenuCoffees(storeId, categoryId, debouncedSearch, sort);
  const coffees = useMemo(() => data?.pages.flat() ?? [], [data]);
  const combinedLoading = isLoading || promotions.isLoading;

  const { data: favoriteIds } = useFavoriteIds();
  const toggleFavorite = useToggleFavorite();
  const addToCart = useAddToCart();

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
      const card = toCoffeeCardData(coffee, promotions.data ?? []);
      addToCart({
        coffeeId: coffee.id,
        storeId: coffee.store_id,
        name: coffee.name,
        imageUrl: coffee.image_url ?? "",
        unitPrice: card.price,
        compareAtUnitPrice: card.compareAtPrice,
      });
    },
    [coffees, promotions.data, addToCart],
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: spacing.lg,
        }}
      >
        <IconButton accessibilityLabel="Go back" onPress={() => router.back()}>
          <ChevronLeft size={20} color={colors.ink} strokeWidth={2} />
        </IconButton>
        <Text
          style={{
            color: colors.ink,
            fontSize: typography.subheading,
            fontWeight: "800",
            marginLeft: spacing.md,
          }}
          numberOfLines={1}
        >
          {store?.name ?? "Menu"}
        </Text>
      </View>

      <Stagger
        stagger={70}
        duration={420}
        entering={() => FadeInUp.duration(420).easing(Easing.out(Easing.cubic))}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.sm,
            paddingHorizontal: spacing.xl,
          }}
        >
          <SearchBar value={searchText} onChangeText={setSearchText} />
          <IconButton
            accessibilityLabel="Sort"
            variant={sort !== "popular" ? "filled" : "default"}
            onPress={() => setSortSheetVisible(true)}
          >
            <SlidersHorizontal
              size={18}
              color={colors.espresso}
              strokeWidth={1.8}
            />
          </IconButton>
        </View>
        <View style={{ height: spacing.md }} />
        <View>
          <MenuCategoryRow
            storeId={storeId}
            selectedId={categoryId}
            onSelect={setCategoryId}
          />
        </View>
      </Stagger>
      <View style={{ height: spacing.md }} />

      {combinedLoading ? (
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
              : "This shop has nothing here yet."
          }
        />
      ) : (
        <AnimatedFlashList
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
            paddingBottom: spacing.xxxl + bottomInset,
          }}
          renderItem={({ item }) => (
            <Animated.View
              style={{ flex: 1, margin: spacing.xs }}
              entering={ZoomInEasyDown.springify()}
            >
              <CoffeeCard
                coffee={toCoffeeCardData(item, promotions.data ?? [])}
                layout="grid"
                liked={favoriteIds?.has(item.id) ?? false}
                onPress={handlePress}
                onToggleFavorite={handleToggleFavorite}
                onAddToCart={handleAddToCart}
              />
            </Animated.View>
          )}
        />
      )}

      <BottomSheet
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
      </BottomSheet>
    </SafeAreaView>
  );
}
