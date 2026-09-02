// src/features/orders/hooks/useOrderTracking.ts: detail query with realtime sync
import { fetchOrderWithItems } from "@/services/orders";
import { supabase } from "@/services/supabase";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

export function useOrderTracking(orderId: string) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["orders", "detail", orderId],
    queryFn: () => fetchOrderWithItems(orderId),
    enabled: !!orderId,
  });

  useEffect(() => {
    if (!orderId) return;
    // Unique topic per mount avoids "cannot add postgres_changes after subscribe" when
    // Supabase reuses a cached channel that is still subscribed (see OrderChat).
    const channelName = `order-detail:${orderId}:${Math.random().toString(36).slice(2, 8)}`;
    const channel = supabase.channel(channelName)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders", filter: `id=eq.${orderId}` },
        (payload: any) => {
          // Patch detail cache for instant UI, then invalidate to refetch joined order_items
          const next = payload.new;
          if (next) {
            queryClient.setQueryData(["orders", "detail", orderId], (old: any) =>
              old ? { ...old, ...next } : old,
            );
          }
          queryClient.invalidateQueries({ queryKey: ["orders", "detail", orderId] });
          queryClient.invalidateQueries({ queryKey: ["orders"] });
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "order_items", filter: `order_id=eq.${orderId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["orders", "detail", orderId] });
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "chat_messages", filter: `order_id=eq.${orderId}` },
        () => {
          // chat badge is handled elsewhere, but detail invalidation keeps counts fresh
          queryClient.invalidateQueries({ queryKey: ["orders", "detail", orderId] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, queryClient]);

  return query;
}
