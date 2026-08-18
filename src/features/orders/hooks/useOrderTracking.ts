// src/features/orders/hooks/useOrderTracking.ts — simplified, no longer owns a subscription
import { fetchOrderWithItems } from "@/services/orders";
import { useQuery } from "@tanstack/react-query";

export function useOrderTracking(orderId: string) {
  return useQuery({
    queryKey: ["orders", "detail", orderId],
    queryFn: () => fetchOrderWithItems(orderId),
  });
}
