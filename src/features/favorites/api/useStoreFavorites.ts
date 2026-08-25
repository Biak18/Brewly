// src/features/favorites/api/useStoreFavorites.ts
import { fetchFavoriteStores } from "@/services/storeFavorites";
import { supabase } from "@/services/supabase";
import { useAuthStore } from "@/stores/authStore";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useFavoriteStoreIds() {
  const userId = useAuthStore((s) => s.session?.user.id);
  return useQuery({
    queryKey: ["store-favorites", "ids", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("store_favorites")
        .select("store_id")
        .eq("user_id", userId!);
      if (error) throw error;
      return new Set(data.map((f) => f.store_id));
    },
    enabled: !!userId,
  });
}

export function useFavoriteStores(userId: string | undefined) {
  return useQuery({
    queryKey: ["store-favorites", "stores", userId],
    queryFn: () => fetchFavoriteStores(userId!),
    enabled: !!userId,
  });
}

export function useToggleStoreFavorite() {
  const userId = useAuthStore((s) => s.session?.user.id);
  const queryClient = useQueryClient();
  const idsKey = ["store-favorites", "ids", userId];

  return useMutation({
    mutationFn: async ({
      storeId,
      liked,
    }: {
      storeId: string;
      liked: boolean;
    }) => {
      if (!userId) throw new Error("Not signed in");
      const query = liked
        ? supabase.from("store_favorites").insert({ user_id: userId, store_id: storeId })
        : supabase
            .from("store_favorites")
            .delete()
            .eq("user_id", userId)
            .eq("store_id", storeId);
      const { error } = await query;
      if (error) throw error;
    },
    onMutate: async ({ storeId, liked }) => {
      await queryClient.cancelQueries({ queryKey: idsKey });
      const previous = queryClient.getQueryData<Set<string>>(idsKey);
      queryClient.setQueryData<Set<string>>(idsKey, (old) => {
        const next = new Set(old);
        if (liked) next.add(storeId);
        else next.delete(storeId);
        return next;
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(idsKey, context.previous);
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ["store-favorites"] }),
  });
}
