// src/features/coffee/hooks/useOpenCoffee.ts
import { CoffeeCardData } from "@/components/coffee/CoffeeCard";
import { CoffeeWithStoreName } from "@/services/coffees";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useCallback } from "react";

export function useOpenCoffee() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useCallback(
    (card: CoffeeCardData) => {
      const seed = {
        id: card.id,
        name: card.name,
        description: card.description,
        base_price: card.compareAtPrice ?? card.price,
        image_url: card.imageUrl,
        category_id: card.categoryId ?? null,
        store_id: card.storeId,
        stores: card.shopName ? { name: card.shopName } : null,
      } as unknown as CoffeeWithStoreName;

      queryClient.setQueryData<CoffeeWithStoreName>(
        ["coffee", card.id],
        (old: CoffeeWithStoreName | undefined) => old ?? seed,
      );
      router.push(`/coffee/${card.id}`);
    },
    [queryClient, router],
  );
}
