// src/features/orders/hooks/useOrdersList.ts
import { fetchOrdersList } from "@/services/orders";
import { useAuthStore } from "@/stores/authStore";
import { useQuery } from "@tanstack/react-query";

export function useOrdersList() {
  const userId = useAuthStore((s) => s.session?.user.id);
  return useQuery({
    queryKey: ["orders", "list", userId],
    queryFn: fetchOrdersList,
    enabled: !!userId,
  });
}
