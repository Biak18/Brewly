// src/app/(tabs)/index.tsx
import { EmptyState } from "@/components/ui/EmptyState";
import { Stagger } from "@/components/ui/Stagger";
import { CategoryRow } from "@/features/home/components/CategoryRow";
import { CoffeeRow } from "@/features/home/components/CoffeeRow";
import { HomeHeader } from "@/features/home/components/HomeHeader";
import { HomeSkeleton } from "@/features/home/components/HomeSkeleton";
import { PromoBanner } from "@/features/home/components/PromoBanner";
import { RecentOrdersRow } from "@/features/home/components/RecentOrdersRow";
import {
  fetchFeaturedCoffees,
  fetchPopularCoffees,
  fetchRecommendedCoffees,
} from "@/services/coffees";
import { useThemeStore } from "@/theme/themeStore";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Coffee as CoffeeIcon } from "lucide-react-native";
import { useCallback, useState } from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  const colors = useThemeStore((s) => s.colors);
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const featured = useQuery({
    queryKey: ["coffees", "featured"],
    queryFn: fetchFeaturedCoffees,
  });
  const popular = useQuery({
    queryKey: ["coffees", "popular"],
    queryFn: fetchPopularCoffees,
  });
  const recommended = useQuery({
    queryKey: ["coffees", "recommended"],
    queryFn: fetchRecommendedCoffees,
  });

  const isLoading =
    featured.isLoading || popular.isLoading || recommended.isLoading;
  const isError = featured.isError || popular.isError || recommended.isError;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ["coffees"] });
    setRefreshing(false);
  }, [queryClient]);

  if (isLoading) return <HomeSkeleton />;

  if (isError) {
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

  const hasAnyCoffees =
    (featured.data?.length ?? 0) +
      (popular.data?.length ?? 0) +
      (recommended.data?.length ?? 0) >
    0;

  if (!hasAnyCoffees) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <EmptyState
          icon={
            <CoffeeIcon size={28} color={colors.espresso} strokeWidth={1.8} />
          }
          title="Menu is empty"
          description="Coffees added from the owner dashboard will show up here."
        />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        style={{ backgroundColor: colors.bg }}
        contentContainerStyle={{
          paddingBottom: 20,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.espresso}
          />
        }
      >
        <Stagger index={0}>
          <HomeHeader />
        </Stagger>
        <Stagger index={1}>
          <PromoBanner />
        </Stagger>
        <Stagger index={2}>
          <View style={{ marginTop: 10 }}>
            <CategoryRow />
          </View>
        </Stagger>
        <Stagger index={3}>
          <CoffeeRow title="Featured" coffees={featured.data ?? []} />
        </Stagger>
        <Stagger index={4}>
          <CoffeeRow title="Popular" coffees={popular.data ?? []} />
        </Stagger>
        <Stagger index={5}>
          <CoffeeRow
            title="Recommended for you"
            coffees={recommended.data ?? []}
          />
        </Stagger>
        <RecentOrdersRow />
        <Stagger index={6}>
          <RecentOrdersRow />
        </Stagger>
      </ScrollView>
    </SafeAreaView>
  );
}
