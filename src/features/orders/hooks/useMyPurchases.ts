// src/features/orders/hooks/useMyPurchases.ts
import { fetchMyPurchases } from "@/services/orders";
import { useAuthStore } from "@/stores/authStore";
import { useQuery } from "@tanstack/react-query";

export function useMyPurchases(limit?: number) {
  const userId = useAuthStore((s) => s.session?.user.id);
  return useQuery({
    queryKey: ["orders", "purchases", userId, limit ?? "all"],
    queryFn: () => fetchMyPurchases(userId!, limit),
    enabled: !!userId,
  });
}
