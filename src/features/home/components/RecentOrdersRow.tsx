// src/features/home/components/RecentOrdersRow.tsx: full replacement
import {
  OrderCard,
  OrderCardData,
} from "@/features/orders/components/OrderCard";
import { useMyPurchases } from "@/features/orders/hooks/useMyPurchases";
import { useTheme } from "@/theme";
import { useRouter } from "expo-router";
import { useCallback } from "react";
import { FlatList, Text, View } from "react-native";

export function RecentOrdersRow() {
  const { colors, spacing, typography } = useTheme();
  const router = useRouter();
  const { data: orders = [] } = useMyPurchases(5);

  const handlePress = useCallback(
    (id: string) => router.push(`/orders/${id}/tracking`),
    [router],
  );

  if (orders.length === 0) return null;

  return (
    <View style={{ marginTop: spacing.xxl }}>
      <Text
        style={{
          color: colors.ink,
          fontSize: typography.subheading,
          fontWeight: "800",
          marginHorizontal: spacing.xl,
          marginBottom: spacing.md,
        }}
      >
        Recent orders
      </Text>
      <FlatList showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false}
 horizontal
 data={orders}
 keyExtractor={(o) => o.id}
 contentContainerStyle={{
 paddingHorizontal: spacing.xl,
 gap: spacing.md,
 }}
 renderItem={({ item }) => {
 const data: OrderCardData = {
 id: item.id,
 status: item.status,
 total: item.total,
 placedAt: item.placed_at,
 itemCount: item.item_count,
 thumbnailUrl: item.thumbnail_url,
 };
 return <OrderCard order={data} onPress={handlePress} layout="row" />;
        }}
      />
    </View>
  );
}
