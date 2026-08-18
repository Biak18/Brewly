// src/features/coffee/hooks/useCoffeeDetail.ts
import { fetchCoffeeById, fetchCoffeeOptions } from "@/services/coffees";
import { useQuery } from "@tanstack/react-query";

export function useCoffeeDetail(id: string) {
  const coffee = useQuery({
    queryKey: ["coffee", id],
    queryFn: () => fetchCoffeeById(id),
  });

  const options = useQuery({
    queryKey: ["coffee-options"],
    queryFn: fetchCoffeeOptions,
  });
  return { coffee, options };
}
