// src/services/stores.ts
import { supabase } from "./supabase";

// export type Store = { id: string; name: string; address: string };
export type Store = {
  id: string;
  name: string;
  address: string;
  hours: { open: string; close: string } | null;
};

export async function fetchStores(): Promise<Store[]> {
  const { data, error } = await supabase
    .from("stores")
    .select("id, name, address, hours");
  if (error) throw error;
  return data;
}

export async function fetchStoreById(id: string): Promise<Store> {
  const { data, error } = await supabase
    .from("stores")
    .select("id, name, address, hours")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function fetchMyStore(userId: string): Promise<Store | null> {
  const { data, error } = await supabase
    .from("stores")
    .select("id, name, address, hours")
    .eq("owner_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}
