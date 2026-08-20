// src/app/(tabs)/shops.tsx
import { EmptyState } from "@/components/ui/EmptyState";
import { Pulse } from "@/components/ui/Pulse";
import { ShopCard } from "@/features/shops/components/ShopCard";
import { fetchStores, Store } from "@/services/stores";
import { useTheme } from "@/theme";
import { AnimatedFlashList } from "@shopify/flash-list";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Store as StoreIcon } from "lucide-react-native";
import { useCallback } from "react";
import { Text, View } from "react-native";
import Animated, { ZoomInEasyDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ShopsScreen() {
  const { colors, spacing, radius, typography } = useTheme();
  const router = useRouter();
  const {
    data: stores = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({ queryKey: ["stores"], queryFn: fetchStores });

  const handlePress = useCallback(
    (id: string) => router.push(`/shop/${id}`),
    [router],
  );

  if (isLoading) {
    return (
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
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <Text
        style={{
          color: colors.ink,
          fontSize: typography.title,
          fontWeight: "800",
          paddingHorizontal: spacing.lg,
          marginBottom: spacing.md,
        }}
      >
        Shops
      </Text>
      <AnimatedFlashList
        data={stores}
        keyExtractor={(s: Store) => s.id}
        contentContainerStyle={{ padding: spacing.lg }}
        renderItem={({ item }: { item: Store }) => (
          <Animated.View
            style={{ flex: 1, margin: spacing.xs }}
            entering={ZoomInEasyDown.springify()}
          >
            <ShopCard store={item} onPress={handlePress} layout="list" />
          </Animated.View>
        )}
      />
    </SafeAreaView>
  );
}
