// src/app/(tabs)/favorites.tsx
import { CoffeeCard } from "@/components/coffee/CoffeeCard";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  useFavoriteCoffees,
  useToggleFavorite,
} from "@/features/favorites/api/useFavorites";
import {
  useFavoriteStores,
  useToggleStoreFavorite,
} from "@/features/favorites/api/useStoreFavorites";
import { ShopCard } from "@/features/shops/components/ShopCard";
import { MenuSkeleton } from "@/features/menu/components/MenuSkeleton";
import { useActivePromotions } from "@/features/promotions/hooks/useActivePromotions";
import { useAddToCart } from "@/hooks/useAddToCart";
import { useRefresh } from "@/hooks/useRefresh";
import { useUserLocation } from "@/hooks/useUserLocation";
import { useAuthStore } from "@/stores/authStore";
import { useTheme } from "@/theme";
import { distanceKm } from "@/utils/geo";
import { getCoffeePricing, toCoffeeCardDataWithShop } from "@/utils/pricing";
import { AnimatedFlashList, FlashList } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import { Heart, Store as StoreIcon } from "lucide-react-native";
import { useCallback, useState } from "react";
import { Pressable, RefreshControl, Text, View } from "react-native";
import Animated, {
  FadeOut,
  LinearTransition,
  ZoomInEasyDown,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

type FavoritesTab = "drinks" | "shops";

function SegmentControl({
  value,
  onChange,
}: {
  value: FavoritesTab;
  onChange: (t: FavoritesTab) => void;
}) {
  const { colors, spacing, radius, typography } = useTheme();
  const options: { key: FavoritesTab; label: string; icon: React.ReactNode }[] =
    [
      {
        key: "drinks",
        label: "Drinks",
        icon: <Heart size={14} color={colors.espresso} strokeWidth={2} />,
      },
      {
        key: "shops",
        label: "Shops",
        icon: <StoreIcon size={14} color={colors.espresso} strokeWidth={2} />,
      },
    ];
  return (
    <View
      style={{
        flexDirection: "row",
        backgroundColor: colors.surface2,
        borderRadius: radius.pill,
        padding: 3,
        marginHorizontal: spacing.lg,
        marginBottom: spacing.md,
      }}
    >
      {options.map((opt) => (
        <Pressable
          key={opt.key}
          accessibilityRole="tab"
          accessibilityState={{ selected: value === opt.key }}
          onPress={() => onChange(opt.key)}
          style={{
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: spacing.xs,
            height: 36,
            borderRadius: radius.pill,
            backgroundColor: value === opt.key ? colors.surface : "transparent",
          }}
        >
          {value === opt.key && opt.icon}
          <Text
            style={{
              color: value === opt.key ? colors.ink : colors.muted,
              fontSize: typography.caption,
              fontWeight: "800",
            }}
          >
            {opt.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export default function FavoritesScreen() {
  const { colors, spacing } = useTheme();
  const router = useRouter();
  const userId = useAuthStore((s) => s.session?.user.id);
  const [tab, setTab] = useState<FavoritesTab>("drinks");
  const { location } = useUserLocation();

  const {
    data: coffees = [],
    isLoading,
    isError,
    refetch,
  } = useFavoriteCoffees(userId);
  const { data: stores = [] } = useFavoriteStores(userId);
  const toggleStoreFavorite = useToggleStoreFavorite();

  const toggleFavorite = useToggleFavorite();
  const { data: promotions = [] } = useActivePromotions();
  const addToCart = useAddToCart();
  const { refreshing, onRefresh } = useRefresh([
    "favorites",
    "store-favorites",
  ]);

  const handlePress = useCallback(
    (id: string) => router.push(`/coffee/${id}`),
    [router],
  );
  const handleShopPress = useCallback(
    (id: string) => router.push(`/shop/${id}`),
    [router],
  );
  const handleRemoveStore = useCallback(
    (storeId: string) => toggleStoreFavorite.mutate({ storeId, liked: false }),
    [toggleStoreFavorite],
  );

  const handleToggleFavorite = useCallback(
    (id: string) => toggleFavorite.mutate({ coffeeId: id, liked: false }),

    [toggleFavorite],
  );
  const handleAddToCart = useCallback(
    (id: string) => {
      const coffee = coffees.find((c) => c.id === id);
      if (!coffee) return;
      const { unitPrice, compareAtUnitPrice } = getCoffeePricing(
        coffee,
        promotions,
      );
      addToCart({
        coffeeId: coffee.id,
        storeId: coffee.store_id,
        name: coffee.name,
        imageUrl: coffee.image_url ?? "",
        unitPrice,
        compareAtUnitPrice,
      });
    },
    [coffees, promotions, addToCart],
  );

  const showShops = tab === "shops";

  if (!showShops && isLoading)
    return (
      <View
        style={{ flex: 1, backgroundColor: colors.bg, paddingTop: spacing.lg }}
      >
        <SegmentControl value={tab} onChange={setTab} />
        <MenuSkeleton />
      </View>
    );

  if (!showShops && isError) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <SegmentControl value={tab} onChange={setTab} />
        <EmptyState
          icon={<Heart size={28} color={colors.espresso} strokeWidth={1.8} />}
          title="Couldn't load favorites"
          description="Check your connection and try again."
          actionLabel="Retry"
          onAction={() => refetch()}
        />
      </View>
    );
  }

  return (
    <SafeAreaView
      style={{
        flex: 1,
        paddingTop: spacing.sm,
        backgroundColor: colors.bg,
      }}
    >
      <View style={{ height: spacing.md }} />
      <SegmentControl value={tab} onChange={setTab} />

      {showShops ? (
        stores.length === 0 ? (
          <EmptyState
            icon={
              <StoreIcon size={28} color={colors.espresso} strokeWidth={1.8} />
            }
            title="No saved shops yet"
            description="Tap the heart on a shop to keep it here."
            actionLabel="Browse shops"
            onAction={() => router.push("/(tabs)/shops")}
          />
        ) : (
          <FlashList
            data={stores}
            keyExtractor={(s) => s.id}
            contentContainerStyle={{
              paddingHorizontal: spacing.lg,
              paddingBottom: spacing.xxxl,
            }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.espresso}
              />
            }
            renderItem={({ item }) => (
              <Animated.View entering={ZoomInEasyDown.springify()}>
                <ShopCard
                  store={item}
                  onPress={handleShopPress}
                  layout="list"
                  favorite
                  distanceKm={
                    location && item.lat != null && item.lng != null
                      ? distanceKm(location, {
                          lat: item.lat,
                          lng: item.lng,
                        })
                      : null
                  }
                  onToggleFavorite={() => handleRemoveStore(item.id)}
                />
              </Animated.View>
            )}
          />
        )
      ) : coffees.length === 0 ? (
        <EmptyState
          icon={<Heart size={28} color={colors.espresso} strokeWidth={1.8} />}
          title="No favorites yet"
          description="Tap the heart on any coffee to save it here."
          actionLabel="Browse menu"
          onAction={() => router.push("/(tabs)/shops")}
        />
      ) : (
        <AnimatedFlashList
          data={coffees}
          numColumns={2}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            paddingHorizontal: spacing.lg,
            paddingBottom: spacing.xxxl,
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.espresso}
            />
          }
          renderItem={({ item }) => {
            const data = toCoffeeCardDataWithShop(item, promotions ?? []);
            return (
              <Animated.View
                style={{ flex: 1, margin: spacing.xs }}
                entering={ZoomInEasyDown.springify()}
                exiting={FadeOut.duration(100)}
                layout={LinearTransition.springify()}
              >
                <CoffeeCard
                  coffee={data}
                  layout="grid"
                  liked
                  onPress={handlePress}
                  onToggleFavorite={handleToggleFavorite}
                  onAddToCart={handleAddToCart}
                />
              </Animated.View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}
