// src/app/seller/menu/index.tsx
import { EmptyState } from "@/components/ui/EmptyState";
import { IconButton } from "@/components/ui/IconButton";
import { Pulse } from "@/components/ui/Pulse";
import { SellerCoffeeCard } from "@/features/seller/components/SellerCoffeeCard";
import {
  useMyStoreCoffees,
  useToggleCoffeeActive,
} from "@/features/seller/hooks/useMyStoreCoffees";
import { Coffee } from "@/services/coffees";
import { fetchMyStore } from "@/services/stores";
import { useAuthStore } from "@/stores/authStore";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/theme";
import { AnimatedFlashList } from "@shopify/flash-list";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import {
  ChevronLeft,
  Coffee as CoffeeIcon,
  Plus,
  Sliders,
} from "lucide-react-native";
import { useCallback } from "react";
import { Text, View } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  ZoomInEasyDown,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

const ITEM_HEIGHT = 108;

function AnimatedSellerCoffeeCard({
  coffee,
  index,
  scrollY,
  onPress,
  onToggleActive,
}: {
  coffee: Coffee;
  index: number;
  scrollY: SharedValue<number>;
  onPress: (id: string) => void;
  onToggleActive: (id: string, next: boolean) => void;
}) {
  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [-1, 0, ITEM_HEIGHT * index, ITEM_HEIGHT * (index + 2)];

    const scale = interpolate(
      scrollY.value,
      inputRange,
      [1, 1, 1, 0],
      Extrapolation.CLAMP,
    );

    return {
      transform: [{ scale }],
    };
  });

  return (
    <Animated.View entering={ZoomInEasyDown.springify()}>
      <Animated.View style={animatedStyle}>
        <SellerCoffeeCard
          coffee={coffee}
          onPress={onPress}
          onToggleActive={onToggleActive}
        />
      </Animated.View>
    </Animated.View>
  );
}

export default function ManageMenuScreen() {
  const { t } = useTranslation();
  const { colors, spacing, typography } = useTheme();
  const router = useRouter();
  const userId = useAuthStore((s) => s.session?.user.id);

  const { data: myStore } = useQuery({
    queryKey: ["my-store", userId],
    queryFn: () => fetchMyStore(userId!),
    enabled: !!userId,
  });

  const { data: coffees = [], isLoading } = useMyStoreCoffees(myStore?.id);
  const toggleActive = useToggleCoffeeActive(myStore?.id);

  const handlePress = useCallback(
    (id: string) => router.push(`/seller/menu/coffee-form?id=${id}`),
    [router],
  );

  const handleToggleActive = useCallback(
    (id: string, next: boolean) => toggleActive.mutate({ id, next }),
    [toggleActive],
  );

  const scrollY = useSharedValue(0);

  const handleScroll = useCallback((event: any) => {
    // This runs on the JS thread – perfectly fine for this use case
    scrollY.value = event.nativeEvent.contentOffset.y;
  }, [scrollY]);

  return (
    <SafeAreaView
      style={{
        flex: 1,
        paddingTop: spacing.sm,
        backgroundColor: colors.bg,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: spacing.lg,
        }}
      >
        <IconButton accessibilityLabel={t("common.back")} onPress={() => router.back()}>
          <ChevronLeft size={20} color={colors.ink} strokeWidth={2} />
        </IconButton>
        <Text
          style={{
            color: colors.ink,
            fontSize: typography.subheading,
            fontWeight: "800",
            marginLeft: spacing.md,
            flex: 1,
          }}
        >{t("seller.manageMenu")}</Text>
        <View style={{ flexDirection: "row", gap: 4 }}>
          <IconButton
            accessibilityLabel={t("seller.addCoffee")}
            variant="filled"
            onPress={() => router.push("/seller/menu/coffee-form")}
          >
            <Plus size={18} color={colors.espresso} strokeWidth={2} />
          </IconButton>
          <IconButton
            accessibilityLabel={t("seller.manageOptions")}
            onPress={() => router.push("/seller/menu/options")}
          >
            <Sliders size={18} color={colors.espresso} strokeWidth={1.8} />
          </IconButton>
        </View>
      </View>

      {isLoading ? (
        <View style={{ padding: spacing.lg, gap: spacing.md }}>
          {[0, 1, 2].map((i) => (
            <Pulse key={i} style={{ height: 76 }} />
          ))}
        </View>
      ) : coffees.length === 0 ? (
        <EmptyState
          icon={
            <CoffeeIcon size={28} color={colors.espresso} strokeWidth={1.8} />
          }
          title={t("seller.noCoffeesYet")}
          description={t("seller.addFirstItem")}
          actionLabel={t("seller.addCoffee")}
          onAction={() => router.push("/seller/menu/coffee-form")}
        />
      ) : (
        <AnimatedFlashList
          data={coffees}
          keyExtractor={(c) => c.id}
          contentContainerStyle={{ padding: spacing.lg }}
          scrollEventThrottle={16}
          onScroll={handleScroll}
          renderItem={({ item, index }) => (
            <AnimatedSellerCoffeeCard
              coffee={item}
              index={index}
              scrollY={scrollY}
              onPress={handlePress}
              onToggleActive={handleToggleActive}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}
