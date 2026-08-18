// src/features/orders/hooks/useOrdersRealtimeSync.ts
import { supabase } from "@/services/supabase";
import { useAuthStore } from "@/stores/authStore";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

// Mounted once, at the root layout. This is the fix for the staleness bug:
// previously each screen (Home's Recent Orders, Tracking) owned its own narrow
// subscription, so it was only a matter of time before a screen was added —
// or existed and was forgotten — that never subscribed at all. One subscription,
// one shared key prefix, every consumer benefits automatically.
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
          // Owners get shop-wide events (matches their RLS scope); staff are
          // filtered to their own orders. RLS enforces this server-side
          // regardless — this filter just avoids the client subscribing to
          // events it would immediately discard.
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
