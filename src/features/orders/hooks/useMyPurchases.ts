// src/features/orders/hooks/useMyPurchases.ts
import { fetchMyPurchases } from "@/services/orders";
import { useAuthStore } from "@/stores/authStore";
import { useQuery } from "@tanstack/react-query";

export function useMyPurchases() {
  const userId = useAuthStore((s) => s.session?.user.id);
  return useQuery({
    queryKey: ["orders", "purchases", userId],
    queryFn: () => fetchMyPurchases(userId!),
    enabled: !!userId,
  });
}
