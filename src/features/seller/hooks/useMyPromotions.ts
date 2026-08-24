// src/features/seller/hooks/useMyPromotions.ts
import { Promotion } from "@/services/promotions";
import {
    fetchMyPromotions,
    togglePromotionActive,
} from "@/services/sellerPromotions";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useMyPromotions(storeId: string | undefined) {
  return useQuery({
    queryKey: ["seller-promotions", storeId],
    queryFn: () => fetchMyPromotions(storeId!),
    enabled: !!storeId,
  });
}

export function useTogglePromotionActive(storeId: string | undefined) {
  const queryClient = useQueryClient();
  const key = ["seller-promotions", storeId];

  return useMutation({
    mutationFn: ({ id, next }: { id: number; next: boolean }) =>
      togglePromotionActive(id, next),
    onMutate: async ({ id, next }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Promotion[]>(key);
      queryClient.setQueryData<Promotion[]>(key, (old) =>
        old?.map((p) => (p.id === id ? { ...p, is_active: next } : p)),
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key });
      queryClient.invalidateQueries({ queryKey: ["promotions"] }); // reaches the customer-facing banner/pricing caches too
    },
  });
}
