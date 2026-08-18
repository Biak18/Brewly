// src/features/promotions/hooks/useActivePromotions.ts — now just the query
import { fetchActivePromotions } from "@/services/promotions";
import { useQuery } from "@tanstack/react-query";

export function useActivePromotions() {
  return useQuery({
    queryKey: ["promotions", "active"],
    queryFn: fetchActivePromotions,
    refetchInterval: 5 * 60 * 1000,
  });
}
