// src/features/orders/hooks/useOrdersRealtimeSync.ts
import { supabase } from "@/services/supabase";
import { useAuthStore } from "@/stores/authStore";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

export function useOrdersRealtimeSync() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.session?.user.id);
  const role = useAuthStore((s) => s.profile?.role);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel("orders-sync")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",

          ...(role !== "owner" ? { filter: `user_id=eq.${userId}` } : {}),
        },
        () => queryClient.invalidateQueries({ queryKey: ["orders"] }),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, role, queryClient]);
}
