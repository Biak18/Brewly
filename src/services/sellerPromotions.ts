// src/services/sellerPromotions.ts
import { Promotion, PromotionScope } from "./promotions";
import { supabase } from "./supabase";

export async function fetchMyPromotions(storeId: string): Promise<Promotion[]> {
  const { data, error } = await supabase
    .from("promotions")
    .select("*")
    .eq("store_id", storeId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as Promotion[];
}

export type PromotionInput = {
  title: string;
  description: string;
  discount_percent: number;
  scope: PromotionScope;
  category_id: string | null;
  coffee_id: string | null;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  code?: string | null;
};

export async function createPromotion(storeId: string, input: PromotionInput) {
  const { error } = await supabase
    .from("promotions")
    .insert({ ...input, store_id: storeId });
  if (error) throw error;
}

export async function updatePromotion(
  id: number,
  input: Partial<PromotionInput>,
) {
  const { error } = await supabase
    .from("promotions")
    .update(input)
    .eq("id", id);
  if (error) throw error;
}

export async function deletePromotion(id: number) {
  const { error } = await supabase.from("promotions").delete().eq("id", id);
  if (error) throw error;
}

export async function togglePromotionActive(id: number, isActive: boolean) {
  const { error } = await supabase
    .from("promotions")
    .update({ is_active: isActive })
    .eq("id", id);
  if (error) throw error;
}
