// src/features/seller/hooks/useMyStoreCoffees.ts
import { Coffee } from "@/services/coffees";
import { fetchMyCoffees, toggleCoffeeActive } from "@/services/sellerMenu";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useMyStoreCoffees(storeId: string | undefined) {
  return useQuery({
    queryKey: ["seller-coffees", storeId],
    queryFn: () => fetchMyCoffees(storeId!),
    enabled: !!storeId,
  });
}

export function useToggleCoffeeActive(storeId: string | undefined) {
  const queryClient = useQueryClient();
  const key = ["seller-coffees", storeId];

  return useMutation({
    mutationFn: ({ id, next }: { id: string; next: boolean }) =>
      toggleCoffeeActive(id, next),
    onMutate: async ({ id, next }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Coffee[]>(key);
      queryClient.setQueryData<Coffee[]>(key, (old) =>
        old?.map((c) => (c.id === id ? { ...c, is_active: next } : c)),
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key });
      queryClient.invalidateQueries({ queryKey: ["coffees"] });
    },
  });
}
