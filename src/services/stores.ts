// src/services/stores.ts
import { supabase } from "./supabase";

export type Store = { id: string; name: string; address: string };

export async function fetchStores(): Promise<Store[]> {
  const { data, error } = await supabase
    .from("stores")
    .select("id, name, address");
  if (error) throw error;
  return data;
}
