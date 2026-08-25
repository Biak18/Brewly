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

// Burns the 10 stamps for this store once the discounted order exists.
// Server re-checks ownership AND that the card still holds a full set —
// so a second concurrent redemption is rejected here, not silently lost.
export async function finalizeRedemption(
  storeId: string,
  orderId: string,
): Promise<void> {
  const { error } = await supabase.rpc("finalize_redemption", {
    p_store_id: storeId,
    p_order_id: orderId,
  });
  if (error) throw error;
}
