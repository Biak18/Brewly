// src/app/(tabs)/index.tsx
import { EmptyState } from "@/components/ui/EmptyState";
import { CoffeeRow } from "@/features/home/components/CoffeeRow";
import { HomeHeader } from "@/features/home/components/HomeHeader";
import { HomeShopsRow } from "@/features/home/components/HomeShopsRow";
import { HomeSkeleton } from "@/features/home/components/HomeSkeleton";
import { PromoBanner } from "@/features/home/components/PromoBanner";
import { RecentOrdersRow } from "@/features/home/components/RecentOrdersRow";
import { useActivePromotions } from "@/features/promotions/hooks/useActivePromotions";
import { useRefresh } from "@/hooks/useRefresh";
import { fetchPopularCoffees } from "@/services/coffees";
import { useTheme } from "@/theme";
import { Stagger } from "@animatereactnative/stagger";
import { useQuery } from "@tanstack/react-query";
import { Coffee as CoffeeIcon } from "lucide-react-native";
import { RefreshControl, ScrollView, View } from "react-native";
import { ZoomInEasyDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  const { colors, spacing } = useTheme();
  const { refreshing, onRefresh } = useRefresh(["coffees"], ["stores"]);

  const popular = useQuery({
    queryKey: ["coffees", "popular"],
    queryFn: fetchPopularCoffees,
  });
  const promotions = useActivePromotions();
  const isLoading = popular.isLoading || promotions.isLoading;

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
        onAction={() => popular.refetch()}
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
          <View style={{ marginTop: spacing.sm }} /> {/* spacer */}
          <PromoBanner />
          <HomeShopsRow />
          <CoffeeRow title="Popular" coffees={popular.data ?? []} />
          <RecentOrdersRow />
          <View style={{ marginBottom: spacing.xxl }} />
        </Stagger>
      </ScrollView>
    </SafeAreaView>
  );
}
