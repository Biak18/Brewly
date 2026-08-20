// src/features/promotions/hooks/useActivePromotions.ts — now just the query
import { fetchActivePromotions } from "@/services/promotions";
import { useQuery } from "@tanstack/react-query";

export function useActivePromotions(storeId?: string) {
  return useQuery({
    queryKey: ["promotions", "active", storeId ?? "all"],
    queryFn: () => fetchActivePromotions(storeId),
    refetchInterval: 5 * 60 * 1000,
  });
}
