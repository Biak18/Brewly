// src/features/favorites/api/useFavorites.ts — full replacement
import { fetchFavoriteCoffees } from "@/services/coffees";
import { supabase } from "@/services/supabase";
import { useAuthStore } from "@/stores/authStore";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useFavoriteIds() {
  const userId = useAuthStore((s) => s.session?.user.id);
  return useQuery({
    queryKey: ["favorites", "ids", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("favorites")
        .select("coffee_id")
        .eq("user_id", userId!);
      if (error) throw error;
      return new Set(data.map((f) => f.coffee_id));
    },
    enabled: !!userId,
  });
}

export function useFavoriteCoffees(userId: string | undefined) {
  return useQuery({
    queryKey: ["favorites", "coffees", userId],
    queryFn: () => fetchFavoriteCoffees(userId!),
    enabled: !!userId,
  });
}

export function useToggleFavorite() {
  const userId = useAuthStore((s) => s.session?.user.id);
  const queryClient = useQueryClient();
  const idsKey = ["favorites", "ids", userId];

  return useMutation({
    mutationFn: async ({
      coffeeId,
      liked,
    }: {
      coffeeId: string;
      liked: boolean;
    }) => {
      if (!userId) throw new Error("Not signed in");
      const query = liked
        ? supabase
            .from("favorites")
            .insert({ user_id: userId, coffee_id: coffeeId })
        : supabase
            .from("favorites")
            .delete()
            .eq("user_id", userId)
            .eq("coffee_id", coffeeId);
      const { error } = await query;
      if (error) throw error;
    },
    onMutate: async ({ coffeeId, liked }) => {
      await queryClient.cancelQueries({ queryKey: idsKey });
      const previous = queryClient.getQueryData<Set<string>>(idsKey);
      queryClient.setQueryData<Set<string>>(idsKey, (old) => {
        const next = new Set(old);
        liked ? next.add(coffeeId) : next.delete(coffeeId);
        return next;
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(idsKey, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["favorites"] }),
  });
}
