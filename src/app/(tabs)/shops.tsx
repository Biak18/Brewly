// src/app/(tabs)/shops.tsx
import { Chip } from "@/components/ui/Chip";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pulse } from "@/components/ui/Pulse";
import {
  useFavoriteStoreIds,
  useToggleStoreFavorite,
} from "@/features/favorites/api/useStoreFavorites";
import { ShopCard } from "@/features/shops/components/ShopCard";
import { useRefresh } from "@/hooks/useRefresh";
import { useUserLocation } from "@/hooks/useUserLocation";
import { fetchStores, Store } from "@/services/stores";
import { useTheme } from "@/theme";
import { distanceKm } from "@/utils/geo";
import { AnimatedFlashList } from "@shopify/flash-list";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Store as StoreIcon } from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import { RefreshControl, Text, View } from "react-native";
import Animated, { ZoomInEasyDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ShopsScreen() {
  const { colors, spacing, typography } = useTheme();
  const router = useRouter();
  const {
    data: stores = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({ queryKey: ["stores"], queryFn: fetchStores });
  const { location, status: locationStatus } = useUserLocation();

  const { data: favoriteStoreIds } = useFavoriteStoreIds();
  const toggleStoreFavorite = useToggleStoreFavorite();

  const sorted = useMemo(() => {
    if (!location) return stores;
    const dist = (s: Store) =>
      s.lat != null && s.lng != null
        ? distanceKm(location, { lat: s.lat, lng: s.lng })
        : Infinity;
    return [...stores].sort((a, b) => dist(a) - dist(b));
  }, [stores, location]);

  const withDistance = useCallback(
    (store: Store) =>
      location && store.lat != null && store.lng != null
        ? distanceKm(location, { lat: store.lat, lng: store.lng })
        : null,
    [location],
  );

  const handlePress = useCallback(
    (id: string) => router.push(`/shop/${id}`),
    [router],
  );
  const { refreshing, onRefresh } = useRefresh(["stores"]);

  // Distance filter — only meaningful once the user's location is known.
  const [radiusKm, setRadiusKm] = useState<number | null>(null);
  const hasLocation = locationStatus === "granted" && !!location;
  const filtered = useMemo(() => {
    if (radiusKm == null) return sorted;
    return sorted.filter((s) => {
      if (!location || s.lat == null || s.lng == null) return false;
      return distanceKm(location, { lat: s.lat, lng: s.lng }) <= radiusKm;
    });
  }, [sorted, radiusKm, location]);

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <View
          style={{
            flex: 1,
            backgroundColor: colors.bg,
            padding: spacing.lg,
            gap: spacing.md,
          }}
        >
          {[0, 1, 2].map((i) => (
            <Pulse key={i} style={{ height: 88 }} />
          ))}
        </View>
      </SafeAreaView>
    );
  }
  if (isError) {
    return (
      <EmptyState
        icon={<StoreIcon size={28} color={colors.espresso} strokeWidth={1.8} />}
        title="Couldn't load shops"
        description="Check your connection and try again."
        actionLabel="Retry"
        onAction={() => refetch()}
      />
    );
  }
  if (stores.length === 0) {
    return (
      <EmptyState
        icon={<StoreIcon size={28} color={colors.espresso} strokeWidth={1.8} />}
        title="No shops yet"
        description="Check back soon."
      />
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
      <Text
        style={{
          color: colors.ink,
          fontSize: typography.title,
          fontWeight: "800",
          paddingHorizontal: spacing.lg,
          marginBottom: spacing.xs,
        }}
      >
        Shops
      </Text>
      <Text
        style={{
          color: colors.muted,
          fontSize: typography.caption,
          paddingHorizontal: spacing.lg,
          marginBottom: spacing.md,
        }}
      >
        {locationStatus === "granted" && location
          ? "Sorted by nearest to you"
          : locationStatus === "denied"
            ? "Turn on location to sort shops by distance."
            : "Finding your location…"}
      </Text>
      {hasLocation && (
        <View
          style={{
            flexDirection: "row",
            gap: spacing.sm,
            paddingHorizontal: spacing.lg,
            marginBottom: spacing.md,
          }}
        >
          {[null, 1, 3, 5].map((r) => (
            <Chip
              key={String(r)}
              label={r == null ? "All" : `≤ ${r} km`}
              active={radiusKm === r}
              onPress={() => setRadiusKm(r)}
            />
          ))}
        </View>
      )}
      {filtered.length === 0 ? (
        <EmptyState
          icon={
            <StoreIcon size={28} color={colors.espresso} strokeWidth={1.8} />
          }
          title={`No shops within ${radiusKm} km`}
          description="Widen the distance filter to see more shops."
          actionLabel="Show all"
          onAction={() => setRadiusKm(null)}
        />
      ) : (
        <AnimatedFlashList
          data={filtered}
          keyExtractor={(s: Store) => s.id}
          contentContainerStyle={{ padding: spacing.lg }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.espresso}
            />
          }
          renderItem={({ item }: { item: Store }) => (
            <Animated.View
              style={{ flex: 1, margin: spacing.xs }}
              entering={ZoomInEasyDown.springify()}
            >
              <ShopCard
                store={item}
                onPress={handlePress}
                layout="list"
                distanceKm={withDistance(item)}
                favorite={favoriteStoreIds?.has(item.id) ?? false}
                onToggleFavorite={() =>
                  toggleStoreFavorite.mutate({
                    storeId: item.id,
                    liked: !(favoriteStoreIds?.has(item.id) ?? false),
                  })
                }
              />
            </Animated.View>
          )}
        />
      )}
    </SafeAreaView>
  );
}
