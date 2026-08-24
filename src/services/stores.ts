// src/services/stores.ts
import { Tables } from "@/types/database";
import { supabase } from "./supabase";

export type Store = Pick<Tables<"stores">, "id" | "name" | "address"> & {
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

export async function fetchMyStore(userId: string): Promise<Store> {
  const { data, error } = await supabase
    .from("stores")
    .select("id, name, address, hours")
    .eq("owner_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data!;
}
