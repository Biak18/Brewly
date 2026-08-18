// src/features/promotions/hooks/usePromotionsRealtimeSync.ts
import { supabase } from "@/services/supabase";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

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
