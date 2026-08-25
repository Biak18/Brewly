// src/services/promotions.ts
import { Tables } from "@/types/database";
import { supabase } from "./supabase";

export type PromotionScope = "all" | "category" | "coffee";
export type Promotion = Omit<Tables<"promotions">, "scope"> & {
  scope: PromotionScope;
};
// export type Promotion = {
//   id: number;
//   title: string;
//   description: string;
//   discount_percent: number;
//   scope: PromotionScope;
//   category_id: string | null;
//   coffee_id: string | null;
//   starts_at: string;
//   ends_at: string;
//   is_active: boolean;
//   store_id: string;
// };

// export async function fetchActivePromotions(): Promise<Promotion[]> {
//   const today = new Date().toISOString().slice(0, 10); // yyyy-mm-dd, matches `date` column type
//   const { data, error } = await supabase
//     .from("promotions")
//     .select("*")
//     .eq("is_active", true)
//     .lte("starts_at", today)
//     .gte("ends_at", today)
//     .order("created_at", { ascending: false });
//   if (error) throw error;
//   return data;
// }

export async function fetchActivePromotions(
  storeId?: string,
): Promise<Promotion[]> {
  const today = new Date().toISOString().slice(0, 10);
  let query = supabase
    .from("promotions")
    .select("*")
    .eq("is_active", true)
    .lte("starts_at", today)
    .gte("ends_at", today)
    .order("created_at", { ascending: false });
  if (storeId) query = query.eq("store_id", storeId);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

// Resolves a voucher code for this store among currently active promotions.
// Returns null when the code doesn't match anything live.
export async function lookupPromoCode(
  storeId: string,
  code: string,
): Promise<Promotion | null> {
  const clean = code.trim();
  if (!storeId || clean.length === 0) return null;
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("promotions")
    .select("*")
    .eq("store_id", storeId)
    .eq("is_active", true)
    .not("code", "is", null)
    .ilike("code", clean)
    .lte("starts_at", today)
    .gte("ends_at", today)
    .maybeSingle();
  if (error) throw error;
  return data;
}
