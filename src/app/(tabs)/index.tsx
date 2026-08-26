// src/app/(tabs)/index.tsx
import { EmptyState } from "@/components/ui/EmptyState";
import { CoffeeRow } from "@/features/home/components/CoffeeRow";
import { HomeHeader } from "@/features/home/components/HomeHeader";
import { HomeShopsRow } from "@/features/home/components/HomeShopsRow";
import { HomeSkeleton } from "@/features/home/components/HomeSkeleton";
import { PromoBanner } from "@/features/home/components/PromoBanner";
import { RecentOrdersRow } from "@/features/home/components/RecentOrdersRow";
import { useActivePromotions } from "@/features/promotions/hooks/useActivePromotions";
import { fetchPopularCoffees } from "@/services/coffees";
import { useTheme } from "@/theme";
import { Stagger } from "@animatereactnative/stagger";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Coffee as CoffeeIcon } from "lucide-react-native";
import { useCallback, useState } from "react";
import { RefreshControl, ScrollView } from "react-native";
import { ZoomInEasyDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  const { colors, spacing } = useTheme();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const popular = useQuery({
    queryKey: ["coffees", "popular"],
    queryFn: fetchPopularCoffees,
  });
  const promotions = useActivePromotions();
  const isLoading = popular.isLoading || promotions.isLoading;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["coffees"] }),
      queryClient.invalidateQueries({ queryKey: ["stores"] }),
    ]);
    setRefreshing(false);
  }, [queryClient]);

  if (isLoading) return <HomeSkeleton />;

  if (popular.isError) {
    return (
      <EmptyState
        icon={
          <CoffeeIcon size={28} color={colors.espresso} strokeWidth={1.8} />
        }
        title="Couldn't load the menu"
        description="Check your connection and try again."
        actionLabel="Retry"
        onAction={() =>
          queryClient.invalidateQueries({ queryKey: ["coffees"] })
        }
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
      <ScrollView
        style={{ backgroundColor: colors.bg }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.espresso}
          />
        }
      >
        <Stagger
          stagger={70}
          duration={420}
          entering={() => ZoomInEasyDown.springify()}
        >
          <HomeHeader />
          <PromoBanner />
          <HomeShopsRow />
          <CoffeeRow title="Popular" coffees={popular.data ?? []} />
          <RecentOrdersRow />
        </Stagger>
      </ScrollView>
    </SafeAreaView>
  );
}
