// src/services/promotions.ts
import { supabase } from "./supabase";

export type PromotionScope = "all" | "category" | "coffee";
export type Promotion = {
  id: number;
  title: string;
  description: string;
  discount_percent: number;
  scope: PromotionScope;
  category_id: string | null;
  coffee_id: string | null;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
};

export async function fetchActivePromotions(): Promise<Promotion[]> {
  const today = new Date().toISOString().slice(0, 10); // yyyy-mm-dd, matches `date` column type
  const { data, error } = await supabase
    .from("promotions")
    .select("*")
    .eq("is_active", true)
    .lte("starts_at", today)
    .gte("ends_at", today)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}
