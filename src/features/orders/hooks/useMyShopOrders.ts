// src/features/orders/hooks/useMyShopOrders.ts
import { fetchMyShopOrders } from "@/services/orders";
import { useQuery } from "@tanstack/react-query";

export function useMyShopOrders(storeId: string | undefined) {
  return useQuery({
    queryKey: ["orders", "shop", storeId],
    queryFn: () => fetchMyShopOrders(storeId!),
    enabled: !!storeId,
  });
}
