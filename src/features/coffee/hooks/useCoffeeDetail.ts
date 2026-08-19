// src/features/coffee/hooks/useCoffeeDetail.ts
import {
  fetchCoffeeById,
  fetchCoffeeOptionsForCategory,
} from "@/services/coffees";
import { useQuery } from "@tanstack/react-query";

export function useCoffeeDetail(id: string) {
  const coffee = useQuery({
    queryKey: ["coffee", id],
    queryFn: () => fetchCoffeeById(id),
  });
  const options = useQuery({
    queryKey: ["coffee-options", coffee.data?.category_id],
    queryFn: () => fetchCoffeeOptionsForCategory(coffee.data!.category_id),
    enabled: !!coffee.data?.category_id,
  });
  return { coffee, options };
}
