// src/services/addresses.ts
import { assertOnline } from "@/lib/offlineGuard";
import { Tables } from "@/types/database";
import { supabase } from "./supabase";

export type Address = Tables<"addresses">;

export type AddressInput = {
  label: string;
  full_name: string;
  phone: string;
  address: string;
  lat?: number | null;
  lng?: number | null;
};

/** "Home · Aung A · 09xxx · 123 Baho Rd", snapshot stored on the order. */
export function formatAddressSnapshot(a: Address): string {
  return [a.label, a.full_name, a.phone, a.address]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(" · ");
}

export async function fetchAddresses(userId: string): Promise<Address[]> {
  const { data, error } = await supabase
    .from("addresses")
    .select("*")
    .eq("user_id", userId)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function createAddress(
  userId: string,
  input: AddressInput,
  isDefault: boolean,
): Promise<Address> {
  assertOnline();
  const { data, error } = await supabase
    .from("addresses")
    .insert({ ...input, user_id: userId, is_default: false })
    .select()
    .single();
  if (error) throw error;
  if (isDefault) await setDefaultAddress(userId, data.id);
  return data;
}

export async function updateAddress(
  addressId: string,
  input: AddressInput,
): Promise<void> {
  assertOnline();
  const { error } = await supabase
    .from("addresses")
    .update(input)
    .eq("id", addressId);
  if (error) throw error;
}

export async function deleteAddress(addressId: string): Promise<void> {
  assertOnline();
  const { error } = await supabase
    .from("addresses")
    .delete()
    .eq("id", addressId);
  if (error) throw error;
}

export async function setDefaultAddress(
  _userId: string,
  addressId: string,
): Promise<void> {
  assertOnline();
  const { error } = await supabase.rpc("set_default_address", {
    p_address_id: addressId,
  });
  if (error) throw error;
}
