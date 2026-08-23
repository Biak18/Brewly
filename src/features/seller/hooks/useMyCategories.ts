// src/features/seller/hooks/useMyCategories.ts
import { fetchCategoriesForStore } from "@/services/coffees";
import { useQuery } from "@tanstack/react-query";

export function useMyCategories(storeId: string | undefined) {
  return useQuery({
    queryKey: ["categories", storeId],
    queryFn: () => fetchCategoriesForStore(storeId!),
    enabled: !!storeId,
  });
}
