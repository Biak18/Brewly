// src/services/search.ts
import type { CoffeeWithStoreName } from "./coffees";
import type { Store } from "./stores";
import { supabase } from "./supabase";

const MIN_TERM_LENGTH = 2;

function escapePostgrestValue(value: string) {
  return value.replaceAll("\\", "\\\\").replaceAll('"', '\\"');
}

export function isValidSearchTerm(term: string) {
  return term.trim().length >= MIN_TERM_LENGTH;
}

export async function searchCoffees(
  term: string,
): Promise<CoffeeWithStoreName[]> {
  const clean = term.trim();
  if (clean.length < MIN_TERM_LENGTH) return [];
  const escaped = escapePostgrestValue(clean);
  const { data, error } = await supabase
    .from("coffees")
    .select("*, stores(name)")
    .eq("is_active", true)
    .or(`name.ilike."%${escaped}%",description.ilike."%${escaped}%"`)
    .order("rating", { ascending: false })
    .limit(20);
  if (error) throw error;
  return data;
}

export async function searchStores(term: string): Promise<Store[]> {
  const clean = term.trim();
  if (clean.length < MIN_TERM_LENGTH) return [];
  const escaped = escapePostgrestValue(clean);
  const { data, error } = await supabase
    .from("stores")
    .select(
      "id, name, address, hours, kpay_phone, payment_note, contact_phone, lat, lng",
    )
    .or(`name.ilike."%${escaped}%",address.ilike."%${escaped}%"`)
    .order("name", { ascending: true })
    .limit(10);
  if (error) throw error;
  return data;
}
