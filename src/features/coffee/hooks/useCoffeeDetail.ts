// src/features/coffee/hooks/useCoffeeDetail.ts
import { fetchCoffeeById, fetchCoffeeOptions } from "@/services/coffees";
import { useQuery } from "@tanstack/react-query";

export function useCoffeeDetail(id: string) {
  const coffee = useQuery({
    queryKey: ["coffee", id],
    queryFn: () => fetchCoffeeById(id),
  });
  // ['coffee-options'] is shared across every coffee detail screen — visiting
  // a second coffee doesn't refetch options, TanStack Query dedupes by key.
  const options = useQuery({
    queryKey: ["coffee-options"],
    queryFn: fetchCoffeeOptions,
  });
  return { coffee, options };
}
