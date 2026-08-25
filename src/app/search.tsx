// src/app/search.tsx
import { CoffeeCard } from "@/components/coffee/CoffeeCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { IconButton } from "@/components/ui/IconButton";
import {
  useFavoriteIds,
  useToggleFavorite,
} from "@/features/favorites/api/useFavorites";
import { SearchBar } from "@/features/menu/components/SearchBar";
import { useActivePromotions } from "@/features/promotions/hooks/useActivePromotions";
import { SearchIdlePanel } from "@/features/search/components/SearchIdlePanel";
import { ShopCard } from "@/features/shops/components/ShopCard";
import { useAddToCart } from "@/hooks/useAddToCart";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useUserLocation } from "@/hooks/useUserLocation";
import { CoffeeWithStoreName } from "@/services/coffees";
import {
  isValidSearchTerm,
  searchCoffees,
  searchStores,
} from "@/services/search";
import type { Store } from "@/services/stores";
import { useSearchStore } from "@/stores/searchStore";
import { useTheme } from "@/theme";
import { distanceKm } from "@/utils/geo";
import { toCoffeeCardDataWithShop } from "@/utils/pricing";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { SearchX } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { FlatList, ListRenderItem, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function SectionLabel({ children }: { children: string }) {
  const { colors, typography } = useTheme();
  return (
    <Text
      style={{
        color: colors.muted,
        fontSize: typography.caption,
        fontWeight: "800",
        textTransform: "uppercase",
        letterSpacing: 1,
        marginBottom: 8,
      }}
    >
      {children}
    </Text>
  );
}

export default function SearchScreen() {
  const { colors, spacing, radius } = useTheme();
  const router = useRouter();
  const [term, setTerm] = useState("");
  const debounced = useDebouncedValue(term, 300);
  const hasTerm = isValidSearchTerm(debounced);

  const stores = useQuery({
    queryKey: ["search", "stores", debounced],
    queryFn: () => searchStores(debounced),
    enabled: hasTerm,
  });
  const coffees = useQuery({
    queryKey: ["search", "coffees", debounced],
    queryFn: () => searchCoffees(debounced),
    enabled: hasTerm,
  });

  const promotions = useActivePromotions();
  const { location } = useUserLocation();
  const { data: favoriteIds } = useFavoriteIds();
  const toggleFavorite = useToggleFavorite();
  const addToCart = useAddToCart();

  // Remember terms that actually matched something.
  const addRecent = useSearchStore((s) => s.addRecent);
  useEffect(() => {
    if (!hasTerm) return;
    if ((stores.data?.length ?? 0) > 0 || (coffees.data?.length ?? 0) > 0) {
      if (!stores.isFetching && !coffees.isFetching) addRecent(debounced);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasTerm, stores.data, coffees.data, stores.isFetching, coffees.isFetching]);

  const handlePickTerm = useCallback(
    (t: string) => setTerm(t),
    [],
  );
  const handlePickStoreId = useCallback(
    (id: string) => router.push(`/shop/${id}`),
    [router],
  );

  const handleCoffeePress = useCallback(
    (id: string) => router.push(`/coffee/${id}`),
    [router],
  );
  const handleStorePress = useCallback(
    (id: string) => router.push(`/shop/${id}`),
    [router],
  );
  const handleToggleFavorite = useCallback(
    (id: string) =>
      toggleFavorite.mutate({ coffeeId: id, liked: !favoriteIds?.has(id) }),
    [favoriteIds, toggleFavorite],
  );
  const handleAddToCart = useCallback(
    (id: string) => {
      const coffee = coffees.data?.find((c) => c.id === id);
      if (!coffee) return;
      const card = toCoffeeCardDataWithShop(coffee, promotions.data ?? []);
      addToCart({
        coffeeId: coffee.id,
        storeId: coffee.store_id,
        name: coffee.name,
        imageUrl: coffee.image_url ?? "",
        unitPrice: card.price,
        compareAtUnitPrice: card.compareAtPrice,
      });
    },
    [coffees.data, promotions.data, addToCart],
  );

  const renderCoffee: ListRenderItem<CoffeeWithStoreName> = useCallback(
    ({ item }) => (
      <View style={{ width: 202 }}>
        <CoffeeCard
          coffee={toCoffeeCardDataWithShop(item, promotions.data ?? [])}
          liked={favoriteIds?.has(item.id) ?? false}
          onPress={handleCoffeePress}
          onToggleFavorite={handleToggleFavorite}
          onAddToCart={handleAddToCart}
        />
      </View>
    ),
    [
      promotions.data,
      favoriteIds,
      handleCoffeePress,
      handleToggleFavorite,
      handleAddToCart,
    ],
  );

  const renderStore: ListRenderItem<Store> = useCallback(
    ({ item }) => (
      <ShopCard
        store={item}
        onPress={handleStorePress}
        layout="row"
        distanceKm={
          location && item.lat != null && item.lng != null
            ? distanceKm(location, { lat: item.lat, lng: item.lng })
            : null
        }
      />
    ),
    [handleStorePress, location],
  );

  const isSearching = hasTerm && (!!stores.isFetching || !!coffees.isFetching);
  const showIdleState = !hasTerm;
  const showNoResults =
    hasTerm &&
    !isSearching &&
    (stores.data?.length ?? 0) === 0 &&
    (coffees.data?.length ?? 0) === 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: spacing.lg,
          paddingBottom: spacing.md,
        }}
      >
        <IconButton accessibilityLabel="Go back" onPress={() => router.back()}>
          <Text style={{ color: colors.ink, fontSize: 20 }}>←</Text>
        </IconButton>
        <View style={{ flex: 1, marginLeft: spacing.sm }}>
          <SearchBar value={term} onChangeText={setTerm} />
        </View>
      </View>

      {showIdleState ? (
        <SearchIdlePanel
          onPickTerm={handlePickTerm}
          onPickStore={handlePickStoreId}
        />
      ) : showNoResults ? (
        <View style={{ padding: spacing.xl, paddingTop: spacing.xxxl }}>
          <EmptyState
            icon={
              <SearchX size={28} color={colors.espresso} strokeWidth={1.8} />
            }
            title="Nothing found"
            description={`No matches for "${debounced.trim()}".`}
          />
        </View>
      ) : isSearching ? (
        <View style={{ padding: spacing.lg }}>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={{
                height: 64,
                borderRadius: radius.md,
                backgroundColor: colors.surface2,
                marginBottom: spacing.md,
              }}
            />
          ))}
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: spacing.lg,
            paddingBottom: spacing.xxxl,
          }}
          keyboardShouldPersistTaps="handled"
        >
          {(stores.data?.length ?? 0) > 0 && (
            <>
              <SectionLabel>Shops</SectionLabel>
              <FlatList
                horizontal
                data={stores.data}
                keyExtractor={(s) => s.id}
                renderItem={renderStore}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{
                  gap: spacing.md,
                  marginBottom: spacing.xl,
                }}
              />
            </>
          )}
          {(coffees.data?.length ?? 0) > 0 && (
            <>
              <SectionLabel>Coffees</SectionLabel>
              <FlatList
                horizontal
                data={coffees.data}
                keyExtractor={(c) => c.id}
                renderItem={renderCoffee}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: spacing.md, paddingBottom: 8 }}
              />
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
