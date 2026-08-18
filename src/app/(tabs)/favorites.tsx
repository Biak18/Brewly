// src/app/(tabs)/favorites.tsx
import { CoffeeCard } from "@/components/coffee/CoffeeCard";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  useFavoriteCoffees,
  useToggleFavorite,
} from "@/features/favorites/api/useFavorites";
import { MenuSkeleton } from "@/features/menu/components/MenuSkeleton";
import { useActivePromotions } from "@/features/promotions/hooks/useActivePromotions";
import { useAuthStore } from "@/stores/authStore";
import { useCartStore } from "@/stores/cartStore";
import { useUIStore } from "@/stores/uiStore";
import { useTheme } from "@/theme";
import { getCoffeePricing, toCoffeeCardData } from "@/utils/pricing";
import { FlashList } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import { Heart } from "lucide-react-native";
import { useCallback } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function FavoritesScreen() {
  const { colors, spacing } = useTheme();
  const router = useRouter();
  const userId = useAuthStore((s) => s.session?.user.id);
  const {
    data: coffees = [],
    isLoading,
    isError,
    refetch,
  } = useFavoriteCoffees(userId);
  const toggleFavorite = useToggleFavorite();
  const addItem = useCartStore((s) => s.addItem);
  const openCartPreview = useUIStore((s) => s.openCartPreview);
  const { data: promotions = [] } = useActivePromotions();

  const handlePress = useCallback(
    (id: string) => router.push(`/coffee/${id}`),
    [router],
  );
  // Every card on this screen is, by definition, already liked — so this is always an unlike, unlike Home/Menu's toggle.
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

  if (isLoading)
    return (
      <View
        style={{ flex: 1, backgroundColor: colors.bg, paddingTop: spacing.lg }}
      >
        <MenuSkeleton />
      </View>
    );

  if (isError) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
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

  if (coffees.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <EmptyState
          icon={<Heart size={28} color={colors.espresso} strokeWidth={1.8} />}
          title="No favorites yet"
          description="Tap the heart on any coffee to save it here."
          actionLabel="Browse menu"
          onAction={() => router.push("/(tabs)/menu")}
        />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <FlashList
        data={coffees}
        numColumns={2}
        keyExtractor={(item) => item.id}
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
                liked
                onPress={handlePress}
                onToggleFavorite={handleToggleFavorite}
                onAddToCart={handleAddToCart}
              />
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}
