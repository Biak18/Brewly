// src/app/coffee/[id].tsx
import { FavoriteButton } from "@/components/coffee/FavoriteButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { IconButton } from "@/components/ui/IconButton";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { CoffeeDetailSkeleton } from "@/features/coffee/components/CoffeeDetailSkeleton";
import { CoffeeHero } from "@/features/coffee/components/CoffeeHero";
import { DetailFooterBar } from "@/features/coffee/components/DetailFooterBar";
import { OptionGroup } from "@/features/coffee/components/OptionGroup";
import { useCoffeeDetail } from "@/features/coffee/hooks/useCoffeeDetail";
import {
  useFavoriteIds,
  useToggleFavorite,
} from "@/features/favorites/api/useFavorites";
import { useActivePromotions } from "@/features/promotions/hooks/useActivePromotions";
import { CoffeeReviews } from "@/features/reviews/components/CoffeeReviews";
import { useAddToCart } from "@/hooks/useAddToCart";
import { track } from "@/lib/analytics";
import { useTheme } from "@/theme";
import { applyDiscount, getCoffeeDiscount } from "@/utils/pricing";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft, Coffee as CoffeeIcon } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  ZoomIn,
  ZoomOut,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function CoffeeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, spacing, typography } = useTheme();
  const { coffee, options } = useCoffeeDetail(id);
  const { data: favoriteIds } = useFavoriteIds();
  const toggleFavorite = useToggleFavorite();
  const { data: promotions = [] } = useActivePromotions();
  const addToCart = useAddToCart();

  const [size, setSize] = useState<string | null>(null);
  const [temperature, setTemperature] = useState<string | null>(null);
  const [milk, setMilk] = useState<string | null>(null);
  const [extras, setExtras] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);

  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });

  useEffect(() => {
    if (id) track("coffee_viewed", { coffee_id: id });
  }, [id]);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [180, 280],
      [0, 1],
      Extrapolation.CLAMP,
    ),
  }));

  const grouped = useMemo(() => {
    const source = options.data ?? [];
    return {
      size: source.filter((o) => o.type === "size"),
      temperature: source.filter((o) => o.type === "temperature"),
      milk: source.filter((o) => o.type === "milk"),
      extra: source.filter((o) => o.type === "extra"),
    };
  }, [options.data]);

  useEffect(() => {
    // Bridging query results into form defaults once they load — an external
    // system sync, not a cascading render hazard.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (grouped.size.length && !size) setSize(grouped.size[0].id);
    if (grouped.temperature.length && !temperature)
      setTemperature(grouped.temperature[0].id);
    if (grouped.milk.length && !milk) setMilk(grouped.milk[0].id);
  }, [grouped, size, temperature, milk]);

  const toggleExtra = useCallback((extraId: string) => {
    setExtras((prev) =>
      prev.includes(extraId)
        ? prev.filter((e) => e !== extraId)
        : [...prev, extraId],
    );
  }, []);

  const pricing = useMemo(() => {
    if (!coffee.data)
      return {
        unitPrice: 0,
        compareAtUnitPrice: undefined as number | undefined,
      };
    const allOptions = options.data ?? [];
    const deltaFor = (optId: string | null) =>
      allOptions.find((o) => o.id === optId)?.price_delta ?? 0;
    const extrasDelta = extras.reduce((sum, exId) => sum + deltaFor(exId), 0);
    const addOnsTotal =
      deltaFor(size) + deltaFor(temperature) + deltaFor(milk) + extrasDelta;

    const promo = getCoffeeDiscount(
      coffee.data.id,
      coffee.data.category_id,
      coffee.data.store_id,
      promotions,
    );
    const { finalPrice: discountedBase, hasDiscount } = applyDiscount(
      coffee.data.base_price,
      promo,
    );

    return {
      unitPrice: discountedBase + addOnsTotal,
      compareAtUnitPrice: hasDiscount
        ? coffee.data.base_price + addOnsTotal
        : undefined,
    };
  }, [coffee.data, options.data, size, temperature, milk, extras, promotions]);

  const { unitPrice, compareAtUnitPrice } = pricing;
  const total = unitPrice * quantity;
  const compareAtTotal =
    compareAtUnitPrice != null ? compareAtUnitPrice * quantity : undefined;
  const liked = favoriteIds?.has(id) ?? false;

  const handleAddToCart = useCallback(() => {
    if (!coffee.data) return;
    const allOptions = options.data ?? [];
    const labelFor = (optId: string | null) =>
      allOptions.find((o) => o.id === optId)?.label;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    addToCart({
      coffeeId: coffee.data.id,
      storeId: coffee.data.store_id,
      name: coffee.data.name,
      imageUrl: coffee.data.image_url ?? "",
      unitPrice,
      compareAtUnitPrice: pricing.compareAtUnitPrice,
      quantity,
      size: labelFor(size),
      temperature: labelFor(temperature),
      milk: labelFor(milk),
      extras: extras.map(labelFor).filter(Boolean) as string[],
      force: true,
    });

    // router.back();
  }, [
    coffee.data,
    options.data,
    size,
    temperature,
    milk,
    extras,
    quantity,
    unitPrice,
    addToCart,
    pricing.compareAtUnitPrice,
  ]);

  if (coffee.isLoading || options.isLoading)
    return (
      <Animated.View
        entering={ZoomIn.duration(320).easing(Easing.out(Easing.cubic))}
        exiting={ZoomOut.duration(220).easing(Easing.in(Easing.cubic))}
        style={{ flex: 1, backgroundColor: colors.bg }}
      >
        <CoffeeDetailSkeleton />
      </Animated.View>
    );

  if (coffee.isError || !coffee.data) {
    return (
      <EmptyState
        icon={
          <CoffeeIcon size={28} color={colors.espresso} strokeWidth={1.8} />
        }
        title="Couldn't load this coffee"
        description="It may have been removed from the menu."
        actionLabel="Go back"
        onAction={() => router.back()}
      />
    );
  }

  return (
    <Animated.View
      entering={ZoomIn.duration(320).easing(Easing.out(Easing.cubic))}
      exiting={ZoomOut.duration(220).easing(Easing.in(Easing.cubic))}
      style={{ flex: 1, backgroundColor: colors.bg }}
    >
      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        <View>
          <CoffeeHero
            imageUrl={coffee.data.image_url ?? ""}
            scrollY={scrollY}
            onDoubleTapFavorite={() =>
              toggleFavorite.mutate({ coffeeId: id, liked: !liked })
            }
          />
          <View style={[styles.heartSlot, { top: insets.top + 12 }]}>
            <FavoriteButton
              liked={liked}
              onToggle={() =>
                toggleFavorite.mutate({ coffeeId: id, liked: !liked })
              }
            />
          </View>
        </View>

        <View style={{ padding: spacing.xl }}>
          {coffee.data.stores?.name && (
            <Pressable
              onPress={() => router.push(`/shop/${coffee.data.store_id}`)}
            >
              <Text
                style={{
                  color: colors.muted,
                  fontSize: typography.caption,
                  marginBottom: 4,
                  textDecorationLine: "underline",
                }}
              >
                {coffee.data.stores.name}
              </Text>
            </Pressable>
          )}
          <Text
            style={{
              color: colors.ink,
              fontSize: typography.title,
              fontWeight: "800",
            }}
          >
            {coffee.data.name}
          </Text>
          <Text
            style={{
              color: colors.muted,
              fontSize: typography.body,
              marginTop: spacing.sm,
              lineHeight: 20,
            }}
          >
            {coffee.data.description}
          </Text>

          <OptionGroup
            title="Size"
            options={grouped.size}
            mode="single"
            selected={size ?? ""}
            onSelect={setSize}
          />
          <OptionGroup
            title="Temperature"
            options={grouped.temperature}
            mode="single"
            selected={temperature ?? ""}
            onSelect={setTemperature}
          />
          <OptionGroup
            title="Milk"
            options={grouped.milk}
            mode="single"
            selected={milk ?? ""}
            onSelect={setMilk}
          />
          <OptionGroup
            title="Extras"
            options={grouped.extra}
            mode="multi"
            selected={extras}
            onSelect={toggleExtra}
          />

          <CoffeeReviews coffeeId={id} />

          <View
            style={{
              marginTop: spacing.xxl,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text
              style={{
                color: colors.ink,
                fontSize: typography.body,
                fontWeight: "800",
              }}
            >
              Quantity
            </Text>
            <QuantityStepper value={quantity} onChange={setQuantity} />
          </View>
        </View>
      </Animated.ScrollView>

      <Animated.View
        style={[
          styles.header,
          headerStyle,
          {
            height: insets.top + 56,
            backgroundColor: colors.surface,
            borderBottomColor: colors.line,
          },
        ]}
        pointerEvents="none"
      >
        <Text
          style={{
            color: colors.ink,
            fontWeight: "800",
            fontSize: typography.body,
            paddingBottom: spacing.xs,
          }}
          numberOfLines={1}
        >
          {coffee.data.name}
        </Text>
      </Animated.View>
      <View style={[styles.backButtonWrap, { top: insets.top + 8 }]}>
        <IconButton accessibilityLabel="Go back" onPress={() => router.back()}>
          <ChevronLeft size={20} color={colors.ink} strokeWidth={2} />
        </IconButton>
      </View>

      <DetailFooterBar
        total={total}
        compareAtTotal={compareAtTotal}
        onAddToCart={handleAddToCart}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backButtonWrap: { position: "absolute", start: 16 }, // was left: 16
  heartSlot: { position: "absolute", end: 16 }, // was right: 16
});
