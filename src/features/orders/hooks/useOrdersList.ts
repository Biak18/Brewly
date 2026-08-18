// src/features/orders/hooks/useOrdersList.ts
import { fetchOrdersList } from "@/services/orders";
import { useAuthStore } from "@/stores/authStore";
import { useQuery } from "@tanstack/react-query";

export function useOrdersList() {
  const userId = useAuthStore((s) => s.session?.user.id);
  const profile = useAuthStore((s) => s.profile);
  const role = useAuthStore((s) => s.profile?.role);

  return useQuery({
    queryKey: ["orders", "list", userId, role],
    queryFn: () => fetchOrdersList(userId!, role!),
    enabled: !!userId && !!role,
  });
}
