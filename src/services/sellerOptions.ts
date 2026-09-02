// src/services/sellerOptions.ts
import { assertOnline } from "@/lib/offlineGuard";
import { supabase } from "./supabase";

export type OptionType = "size" | "temperature" | "milk" | "extra";
export type SellerOption = {
  id: string;
  type: OptionType;
  label: string;
  price_delta: number;
  categoryIds: string[];
};

export async function fetchMyOptions(storeId: string): Promise<SellerOption[]> {
  const { data, error } = await supabase
    .from("coffee_options")
    .select(
      "id, type, label, price_delta, coffee_option_categories(category_id)",
    )
    .eq("store_id", storeId)
    .order("type")
    .order("label");
  if (error) throw error;
  return (data ?? []).map((row: any) => ({
    id: row.id,
    type: row.type,
    label: row.label,
    price_delta: row.price_delta,
    categoryIds: (row.coffee_option_categories ?? []).map(
      (r: any) => r.category_id,
    ),
  }));
}

export type OptionInput = {
  type: OptionType;
  label: string;
  price_delta: number;
};

export async function createOption(
  storeId: string,
  input: OptionInput,
): Promise<string> {
  assertOnline();
  const { data, error } = await supabase
    .from("coffee_options")
    .insert({ ...input, store_id: storeId })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

export async function updateOption(id: string, input: Partial<OptionInput>) {
  assertOnline();
  const { error } = await supabase
    .from("coffee_options")
    .update(input)
    .eq("id", id);
  if (error) throw error;
}

export async function deleteOption(id: string) {
  assertOnline();
  const { error } = await supabase.from("coffee_options").delete().eq("id", id);
  if (error) throw error;
}

export async function setOptionCategoryScoping(
  optionId: string,
  categoryIds: string[],
) {
  assertOnline();
  const { error } = await supabase.rpc("set_option_category_scoping", {
    p_option_id: optionId,
    p_category_ids: categoryIds,
  });
  if (error) throw error;
}
