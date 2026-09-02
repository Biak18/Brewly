// src/app/(tabs)/orders.tsx Р Р†Р вЂљРІР‚Сњ full replacement
import { Chip } from "@/components/ui/Chip";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pulse } from "@/components/ui/Pulse";
import {
  OrderCard,
  OrderCardData,
} from "@/features/orders/components/OrderCard";
import { useMyPurchasesInfinite } from "@/features/orders/hooks/useMyPurchasesInfinite";
import { useMyShopOrdersInfinite } from "@/features/orders/hooks/useMyShopOrdersInfinite";
import { OrderStatus, OrderSummary } from "@/services/orders";
import { fetchMyStore } from "@/services/stores";
import { useAuthStore } from "@/stores/authStore";
import { useTheme } from "@/theme";
import { useRefresh } from "@/hooks/useRefresh";
import { FlashList } from "@shopify/flash-list";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { ReceiptText } from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import { FlatList, RefreshControl, View } from "react-native";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";



export default function OrdersScreen() {
  const { colors, spacing } = useTheme();
  const { t } = useTranslation();
  const FILTERS: { value: OrderStatus | "all"; label: string }[] = [
    { value: "all", label: t("ordersTab.filterAll") },
    { value: "received", label: t("ordersTab.filterReceived") },
    { value: "preparing", label: t("ordersTab.filterPreparing") },
    { value: "ready", label: t("ordersTab.filterReady") },
    { value: "completed", label: t("ordersTab.filterCompleted") },
    { value: "cancelled", label: t("ordersTab.filterCancelled") },
  ];
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const userId = useAuthStore((s) => s.session?.user.id);
  const isSeller = profile?.role === "seller";

  const { data: myStore, isLoading: isMyStoreLoading } = useQuery({
    queryKey: ["my-store", userId],
    queryFn: () => fetchMyStore(userId!),
    enabled: !!userId && isSeller,
  });

  // Sellers land on "shop" by default Р Р†Р вЂљРІР‚Сњ orders needing fulfillment is the
  // actionable view; their own purchase history is secondary.
  const [viewMode, setViewMode] = useState<"purchases" | "shop">(
    isSeller ? "shop" : "purchases",
  );
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");

  const purchases = useMyPurchasesInfinite();
  const shopOrders = useMyShopOrdersInfinite(
    isSeller ? myStore?.id : undefined,
  );
  const active = viewMode === "shop" ? shopOrders : purchases;
  const { isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    active;
  const { refreshing, onRefresh } = useRefresh(["orders"]);
  const orders = useMemo(
    () => active.data?.pages.flatMap((p) => p.orders) ?? [],
    [active.data],
  );

  // "shop" mode has a two-stage dependency: know the store, then fetch its
  // orders. Without accounting for the first stage, this would briefly show
  // a false "No orders yet" while myStore is still resolving.
  const isLoading =
    viewMode === "shop"
      ? isMyStoreLoading || active.isLoading
      : active.isLoading;

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const filteredOrders = useMemo(
    () =>
      statusFilter === "all"
        ? orders
        : orders.filter((o) => o.status === statusFilter),
    [orders, statusFilter],
  );

  const handlePress = useCallback(
    (id: string) => router.push(`/orders/${id}/tracking`),
    [router],
  );
  const renderItem = useCallback(
    ({ item }: { item: OrderSummary }) => {
      const data: OrderCardData = {
        id: item.id,
        status: item.status,
        total: item.total,
        placedAt: item.placed_at,
        itemCount: item.item_count,
        thumbnailUrl: item.thumbnail_url,
      };
      return <OrderCard order={data} onPress={handlePress} layout="list" />;
    },
    [handlePress],
  );

  return (
    <SafeAreaView
      style={{
        flex: 1,
        paddingTop: spacing.sm,
        backgroundColor: colors.bg,
      }}
    >
      {isSeller && (
        <View
          style={{
            flexDirection: "row",
            gap: spacing.sm,
            paddingHorizontal: spacing.lg,
            marginBottom: spacing.md,
          }}
        >
          <Chip
            label={t("ordersTab.myShop")}
            active={viewMode === "shop"}
            onPress={() => setViewMode("shop")}
          />
          <Chip
            label={t("ordersTab.myPurchases")}
            active={viewMode === "purchases"}
            onPress={() => setViewMode("purchases")}
          />
        </View>
      )}

      <View style={{ paddingBottom: spacing.md }}>
        <FlatList showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false}
 horizontal
 style={{ height: 38 }}
 data={FILTERS}
 keyExtractor={(f) => f.value}
 renderItem={({ item }) => (
 <Chip
 label={item.label}
 active={statusFilter === item.value}
 onPress={() => setStatusFilter(item.value)}
 />
          )}
          contentContainerStyle={{
            paddingHorizontal: spacing.lg,
            gap: spacing.sm,
            marginBottom: spacing.md,
          }}
        />
      </View>
      {isLoading ? (
        <View style={{ padding: spacing.lg, gap: spacing.md }}>
          {[0, 1, 2, 3].map((i) => (
            <Pulse key={i} style={{ height: 76 }} />
          ))}
        </View>
      ) : isError ? (
        <EmptyState
          icon={
            <ReceiptText size={28} color={colors.espresso} strokeWidth={1.8} />
          }
          title={t("ordersTab.loadError")}
          description={t("common.checkConnection")}
          actionLabel={t("common.retry")}
          onAction={() => refetch()}
        />
      ) : orders.length === 0 ? (
        <EmptyState
          icon={
            <ReceiptText size={28} color={colors.espresso} strokeWidth={1.8} />
          }
          title={t("ordersTab.emptyTitle")}
          description={
            viewMode === "shop"
              ? t("ordersTab.emptyShopDescription")
              : t("ordersTab.emptyPurchasesDescription")
          }
        />
      ) : filteredOrders.length === 0 ? (
        <EmptyState
          icon={
            <ReceiptText size={28} color={colors.espresso} strokeWidth={1.8} />
          }
          title={t("ordersTab.noOrdersHere")}
          description={t("ordersTab.noOrdersFiltered", { status: statusFilter })}
        />
      ) : (
        <FlashList showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false}
 data={filteredOrders}
 keyExtractor={(o) => o.id}
 renderItem={renderItem}
 contentContainerStyle={{ padding: spacing.lg }}
 onEndReached={loadMore}
 onEndReachedThreshold={0.5}
 refreshControl={
 <RefreshControl
 refreshing={refreshing}
 onRefresh={onRefresh}
 tintColor={colors.espresso}
 />
          }
          ListFooterComponent={
            isFetchingNextPage ? <Pulse style={{ height: 76 }} /> : null
          }
        />
      )}
    </SafeAreaView>
  );
}
