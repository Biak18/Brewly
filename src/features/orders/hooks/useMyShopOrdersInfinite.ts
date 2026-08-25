// src/features/orders/hooks/useMyShopOrdersInfinite.ts
import {
  fetchMyShopOrdersPage,
  OrderSummaryPage,
} from "@/services/orders";
import { useInfiniteQuery } from "@tanstack/react-query";

export function useMyShopOrdersInfinite(storeId: string | undefined) {
  return useInfiniteQuery<
    OrderSummaryPage,
    Error,
    { pages: OrderSummaryPage[]; pageParams: number[] },
    (string | undefined)[],
    number
  >({
    queryKey: ["orders", "shop", storeId, "infinite"],
    queryFn: ({ pageParam }) => fetchMyShopOrdersPage(storeId!, pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages, lastPageParam) =>
      lastPage.hasMore ? lastPageParam + 1 : undefined,
    enabled: !!storeId,
  });
}
