// src/features/home/components/RecentOrdersRow.tsx — full replacement
import {
  OrderCard,
  OrderCardData,
} from "@/features/orders/components/OrderCard";
import { OrderStatus } from "@/services/orders";
import { supabase } from "@/services/supabase";
import { useAuthStore } from "@/stores/authStore";
import { useTheme } from "@/theme";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useCallback } from "react";
import { FlatList, Text, View } from "react-native";

type RecentOrderRow = {
  id: string;
  status: OrderStatus;
  total: number;
  placed_at: string;
  order_items: { coffees: { image_url: string | null } | null }[];
};

export function RecentOrdersRow() {
  const { colors, spacing, typography } = useTheme();
  const router = useRouter();
  const userId = useAuthStore((s) => s.session?.user.id);

  const { data: orders = [] } = useQuery({
    queryKey: ["orders", "recent", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, status, total, placed_at, order_items(coffees(image_url))")
        .eq("user_id", userId!)
        .order("placed_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data as RecentOrderRow[];
    },
    enabled: !!userId,
  });

  const handlePress = useCallback(
    (id: string) => router.push(`/orders/${id}/tracking`),
    [router],
  );

  if (orders.length === 0) return null;

  return (
    <View style={{ marginTop: spacing.xxl, marginBottom: spacing.xxl }}>
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
      <FlatList
        horizontal
        data={orders}
        keyExtractor={(o) => o.id}
        showsHorizontalScrollIndicator={false}
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
            itemCount: item.order_items?.length ?? 0,
            thumbnailUrl: item.order_items?.[0]?.coffees?.image_url ?? null,
          };
          return <OrderCard order={data} onPress={handlePress} layout="row" />;
        }}
      />
    </View>
  );
}
