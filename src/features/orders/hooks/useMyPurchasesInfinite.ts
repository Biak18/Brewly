// src/features/orders/hooks/useMyPurchasesInfinite.ts
import {
  fetchMyPurchasesPage,
  OrderSummaryPage,
} from "@/services/orders";
import { useAuthStore } from "@/stores/authStore";
import { useInfiniteQuery } from "@tanstack/react-query";

export function useMyPurchasesInfinite() {
  const userId = useAuthStore((s) => s.session?.user.id);
  return useInfiniteQuery<
    OrderSummaryPage,
    Error,
    { pages: OrderSummaryPage[]; pageParams: number[] },
    (string | undefined)[],
    number
  >({
    queryKey: ["orders", "purchases", userId, "infinite"],
    queryFn: ({ pageParam }) => fetchMyPurchasesPage(userId!, pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages, lastPageParam) =>
      lastPage.hasMore ? lastPageParam + 1 : undefined,
    enabled: !!userId,
  });
}
