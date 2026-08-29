// src/services/storeFavorites.ts
import { supabase } from "./supabase";
import type { Store } from "./stores";

export async function fetchFavoriteStores(userId: string): Promise<Store[]> {
  const { data, error } = await supabase
    .from("store_favorites")
    .select(
      "stores(id, name, address, hours, kpay_phone, payment_note, contact_phone, lat, lng)",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row: any) => row.stores);
}
