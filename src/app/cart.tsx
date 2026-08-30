// src/app/cart.tsx
import { CoffeePrice } from "@/components/coffee/CoffeePrice";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { IconButton } from "@/components/ui/IconButton";
import { CartLineItemCard } from "@/features/cart/components/CartLineItemCard";
import { fetchActiveCoffeesByIds } from "@/services/coffees";
import { fetchExpectedCartPrices } from "@/services/orders";
import {
  CartLineItem,
  selectCartSavings,
  selectCartTotal,
  useCartStore,
} from "@/stores/cartStore";
import { useToastStore } from "@/stores/toastStore";
import { useTheme } from "@/theme";
import { formatCurrency } from "@/utils/currency";
import { useFocusEffect, useRouter } from "expo-router";
import { ChevronLeft, ShoppingBag } from "lucide-react-native";
import { useCallback, useEffect, useRef } from "react";
import { FlatList, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from "react-native-reanimated";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CartScreen() {
  const { colors, spacing, typography } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const savings = useCartStore(selectCartSavings);

  const removeItem = useCartStore((s) => s.removeItem);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const updateItem = useCartStore((s) => s.updateItem);
  const total = useCartStore(selectCartTotal);

  const addItem = useCartStore((s) => s.addItem);
  const showToast = useToastStore((s) => s.show);
  const lastCheckedIds = useRef("");

  useEffect(() => {
    const ids = [...new Set(items.map((item) => item.coffeeId))].sort();
    const signature = ids.join(",");
    if (!signature || signature === lastCheckedIds.current) return;
    lastCheckedIds.current = signature;

    let cancelled = false;
    fetchActiveCoffeesByIds(ids)
      .then((activeCoffees) => {
        if (cancelled) return;
        if (activeCoffees.length === 0) return;
        const activeById = new Map(
          activeCoffees.map((coffee) => [coffee.id, coffee]),
        );
        const unavailable = items.filter(
          (item) => !activeById.has(item.coffeeId),
        );
        unavailable.forEach((item) => removeItem(item.id));
        items.forEach((item) => {
          const coffee = activeById.get(item.coffeeId);
          if (!coffee) return;
          if (
            item.name !== coffee.name ||
            item.imageUrl !== (coffee.image_url ?? "")
          ) {
            updateItem(item.id, {
              name: coffee.name,
              imageUrl: coffee.image_url ?? "",
            });
          }
        });
        if (unavailable.length > 0) {
          showToast(t("cart.unavailableRemoved"));
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [items, removeItem, updateItem, showToast]);

  // Re-price persisted cart lines against the server on every visit. Lines
  // cache unit_price at add-time; promotions and menu edits happen after, so
  // cached prices can silently drift from what checkout will validate against.
  const repriceCart = useCallback(async () => {
    const current = useCartStore.getState().items;
    if (current.length === 0) return;
    try {
      const expected = await fetchExpectedCartPrices(current);
      let changed = 0;
      let removed = 0;
      for (const line of current) {
        const price = expected.get(line.id);
        if (price === undefined) continue;
        if (price === null) {
          removeItem(line.id);
          removed += 1;
          continue;
        }
        if (
          Math.abs(price.unitPrice - line.unitPrice) > 0.001 ||
          price.compareAtUnitPrice !== line.compareAtUnitPrice
        ) {
          updateItem(line.id, {
            unitPrice: price.unitPrice,
            compareAtUnitPrice: price.compareAtUnitPrice,
          });
          changed += 1;
        }
      }
      if (removed > 0) {
        showToast(t("cart.unavailableRemoved"));
      } else if (changed > 0) {
        showToast(t("cart.pricesUpdated"));
      }
    } catch {
      // Pricing service unavailable — keep cached prices; checkout
      // re-validates server-side anyway.
    }
  }, [removeItem, updateItem, showToast]);

  useFocusEffect(
    useCallback(() => {
      void repriceCart();
    }, [repriceCart]),
  );

  const handleRemove = useCallback(
    (lineId: string) => {
      const removed = items.find((i) => i.id === lineId);
      removeItem(lineId);
      if (removed) {
        showToast(t("cart.removed"), {
          actionLabel: t("cart.undo"),
          onAction: () =>
            addItem({
              coffeeId: removed.coffeeId,
              storeId: removed.storeId,
              name: removed.name,
              imageUrl: removed.imageUrl,
              unitPrice: removed.unitPrice,
              compareAtUnitPrice: removed.compareAtUnitPrice,
              quantity: removed.quantity,
              size: removed.size,
              temperature: removed.temperature,
              milk: removed.milk,
              extras: removed.extras,
            }),
        });
      }
    },
    [items, removeItem, addItem, showToast],
  );

  const bump = useSharedValue(1);
  useEffect(() => {
    bump.value = withSequence(
      withSpring(1.08, { damping: 8 }),
      withSpring(1, { damping: 10 }),
    );
  }, [total, bump]);
  const totalStyle = useAnimatedStyle(() => ({
    transform: [{ scale: bump.value }],
  }));

  const renderItem = useCallback(
    ({ item }: { item: CartLineItem }) => (
      <CartLineItemCard
        item={item}
        // onRemove={removeItem}
        onRemove={handleRemove}
        onQuantityChange={setQuantity}
      />
    ),
    [handleRemove, setQuantity],
  );

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
          }}
        >
          {t("cart.title")}
        </Text>
      </View>

      {items.length === 0 ? (
        <EmptyState
          icon={
            <ShoppingBag size={28} color={colors.espresso} strokeWidth={1.8} />
          }
          title={t("cart.emptyTitle")}
          description={t("cart.emptyDescription")}
          actionLabel={t("cart.browseMenu")}
          onAction={() => router.push("/(tabs)/shops")}
        />
      ) : (
        <>
          <FlatList
            data={items}
            keyExtractor={(i) => i.id}
            renderItem={renderItem}
            contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}
          />
          <View
            style={{
              padding: spacing.xl,
              borderTopWidth: 1,
              borderTopColor: colors.line,
              backgroundColor: colors.surface,
            }}
          >
            {savings > 0 && (
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: spacing.xs,
                }}
              >
                <Text
                  style={{
                    color: colors.green,
                    fontSize: typography.caption,
                    fontWeight: "600",
                  }}
                >
                  {t("cart.saving")}
                </Text>
                <Text
                  style={{
                    color: colors.green,
                    fontSize: typography.caption,
                    fontWeight: "800",
                  }}
                >
                  {formatCurrency(savings)}
                </Text>
              </View>
            )}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: spacing.md,
              }}
            >
              <Text style={{ color: colors.muted, fontSize: typography.body }}>
                {t("cart.total")}
              </Text>
              <Animated.View style={totalStyle}>
                <CoffeePrice value={total} size={22} />
              </Animated.View>
            </View>
            <Button
              label={t("cart.proceedToCheckout")}
              onPress={() => router.push("/checkout")}
              variant="primary"
            />
          </View>
        </>
      )}
    </SafeAreaView>
  );
}
