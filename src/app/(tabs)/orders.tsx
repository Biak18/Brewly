// src/app/(tabs)/orders.tsx
import { EmptyState } from "@/components/ui/EmptyState";
import { Pulse } from "@/components/ui/Pulse";
import {
  OrderCard,
  OrderCardData,
} from "@/features/orders/components/OrderCard";
import { useOrdersList } from "@/features/orders/hooks/useOrdersList";
import { OrderSummary } from "@/services/orders";
import { useTheme } from "@/theme";
import { FlashList } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import { ReceiptText } from "lucide-react-native";
import { useCallback } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function OrdersScreen() {
  const { colors, spacing, radius, typography } = useTheme();
  const router = useRouter();
  const { data: orders = [], isLoading, isError, refetch } = useOrdersList();

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
      <EmptyState
        icon={
          <ReceiptText size={28} color={colors.espresso} strokeWidth={1.8} />
        }
        title="No orders yet"
        description="Orders you place will show up here."
      />
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <FlashList
        data={orders}
        keyExtractor={(o) => o.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: spacing.lg }}
      />
    </SafeAreaView>
  );
}
