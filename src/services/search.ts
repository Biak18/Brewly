// src/services/search.ts
import { supabase } from "./supabase";
import type { CoffeeWithStoreName } from "./coffees";
import type { Store } from "./stores";

const MIN_TERM_LENGTH = 2;

export function isValidSearchTerm(term: string) {
  return term.trim().length >= MIN_TERM_LENGTH;
}

export async function searchCoffees(
  term: string,
): Promise<CoffeeWithStoreName[]> {
  const clean = term.trim();
  if (clean.length < MIN_TERM_LENGTH) return [];
  const { data, error } = await supabase
    .from("coffees")
    .select("*, stores(name)")
    .eq("is_active", true)
    .or(`name.ilike.%${clean}%,description.ilike.%${clean}%`)
    .order("rating", { ascending: false })
    .limit(20);
  if (error) throw error;
  return data;
}

export async function searchStores(term: string): Promise<Store[]> {
  const clean = term.trim();
  if (clean.length < MIN_TERM_LENGTH) return [];
  const { data, error } = await supabase
    .from("stores")
    .select("id, name, address, hours, kpay_phone, payment_note")
    .or(`name.ilike.%${clean}%,address.ilike.%${clean}%`)
    .order("name", { ascending: true })
    .limit(10);
  if (error) throw error;
  return data;
}
