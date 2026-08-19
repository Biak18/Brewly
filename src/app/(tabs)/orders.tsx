// src/app/(tabs)/orders.tsx
import { Chip } from "@/components/ui/Chip";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pulse } from "@/components/ui/Pulse";
import {
  OrderCard,
  OrderCardData,
} from "@/features/orders/components/OrderCard";
import { useOrdersList } from "@/features/orders/hooks/useOrdersList";
import { OrderStatus, OrderSummary } from "@/services/orders";
import { useTheme } from "@/theme";
import { FlashList } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import { ReceiptText } from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import { FlatList, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const FILTERS: { value: OrderStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "received", label: "Received" },
  { value: "preparing", label: "Preparing" },
  { value: "ready", label: "Ready" },
  { value: "completed", label: "Completed" },
];

export default function OrdersScreen() {
  const { colors, spacing, radius, typography } = useTheme();
  const router = useRouter();
  const { data: orders = [], isLoading, isError, refetch } = useOrdersList();
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
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
        {[0, 1, 2, 3].map((i) => (
          <Pulse key={i} style={{ height: 76 }} />
        ))}
      </View>
    );
  }

  if (isError) {
    return (
      <EmptyState
        icon={
          <ReceiptText size={28} color={colors.espresso} strokeWidth={1.8} />
        }
        title="Couldn't load orders"
        description="Check your connection and try again."
        actionLabel="Retry"
        onAction={() => refetch()}
      />
    );
  }

  if (orders.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <EmptyState
          icon={
            <ReceiptText size={28} color={colors.espresso} strokeWidth={1.8} />
          }
          title="No orders yet"
          description="Orders you place will show up here."
        />
      </View>
    );
  }

  // if (filteredOrders.length === 0 && orders.length > 0) {
  //   return (
  //     <View style={{ flex: 1, backgroundColor: colors.bg }}>
  //       <EmptyState
  //         icon={
  //           <ReceiptText size={28} color={colors.espresso} strokeWidth={1.8} />
  //         }
  //         title="No orders here"
  //         description={`No ${statusFilter} orders right now.`}
  //       />
  //     </View>
  //   );
  // }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View>
        <FlatList
          horizontal
          data={FILTERS}
          keyExtractor={(f) => f.value}
          renderItem={({ item }) => (
            <Chip
              label={item.label}
              active={statusFilter === item.value}
              onPress={() => setStatusFilter(item.value)}
            />
          )}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: spacing.lg,
            gap: spacing.sm,
            marginBottom: spacing.md,
            height: 38,
            maxHeight: 38,
          }}
        />
      </View>

      <FlashList
        data={filteredOrders}
        keyExtractor={(o) => o.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: spacing.lg }}
        ListEmptyComponent={() => (
          <EmptyState
            icon={
              <ReceiptText
                size={28}
                color={colors.espresso}
                strokeWidth={1.8}
              />
            }
            title="No orders here"
            description={`No ${statusFilter} orders right now.`}
          />
        )}
      />
    </SafeAreaView>
  );
}
