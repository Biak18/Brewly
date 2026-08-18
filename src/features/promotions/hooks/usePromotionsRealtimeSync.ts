// src/features/promotions/hooks/usePromotionsRealtimeSync.ts
import { supabase } from "@/services/supabase";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

// Mounted once, at the root layout — same reasoning as useOrdersRealtimeSync.
// useActivePromotions() below is called from three simultaneously-mounted
// screens; only ONE thing is allowed to own the actual channel subscription.
export function usePromotionsRealtimeSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("promotions-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "promotions" },
        () => queryClient.invalidateQueries({ queryKey: ["promotions"] }),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
