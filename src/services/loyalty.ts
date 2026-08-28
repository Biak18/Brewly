// src/services/loyalty.ts
import { supabase } from "./supabase";

export type LoyaltyCard = {
  store_id: string;
  store_name: string;
  stamps: number;
};

export const LOYALTY_REWARD_AT = 10;

export async function fetchMyLoyaltyCards(): Promise<LoyaltyCard[]> {
  const { data, error } = await supabase
    .from("loyalty_cards")
    .select("store_id, stamps, stores(name)")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row: any) => ({
    store_id: row.store_id,
    store_name: row.stores?.name ?? "Store",
    stamps: row.stamps,
  }));
}

export async function fetchCardForStore(
  storeId: string,
): Promise<LoyaltyCard | null> {
  const cards = await fetchMyLoyaltyCards();
  return cards.find((c) => c.store_id === storeId) ?? null;
}
