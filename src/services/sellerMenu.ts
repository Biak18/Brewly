// src/services/sellerMenu.ts
import { Coffee } from "./coffees";
import { supabase } from "./supabase";

export async function fetchMyCoffees(storeId: string): Promise<Coffee[]> {
  const { data, error } = await supabase
    .from("coffees")
    .select("*")
    .eq("store_id", storeId)
    .order("name");
  if (error) throw error;
  return data;
}

export type CoffeeInput = {
  name: string;
  description: string;
  base_price: number;
  image_url: string;
  category_id: string;
  is_featured: boolean;
  is_active: boolean;
};

export async function createCoffee(storeId: string, input: CoffeeInput) {
  const { data, error } = await supabase
    .from("coffees")
    .insert({ ...input, store_id: storeId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateCoffee(id: string, input: Partial<CoffeeInput>) {
  const { error } = await supabase.from("coffees").update(input).eq("id", id);
  if (error) throw error;
}

export async function toggleCoffeeActive(id: string, isActive: boolean) {
  const { error } = await supabase
    .from("coffees")
    .update({ is_active: isActive })
    .eq("id", id);
  if (error) throw error;
}

export async function createCategory(storeId: string, name: string) {
  const { data, error } = await supabase
    .from("categories")
    .insert({ store_id: storeId, name, sort_order: 0 })
    .select()
    .single();
  if (error) throw error;
  return data;
}
