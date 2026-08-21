// src/services/storage.ts
import { decode } from "base64-arraybuffer";
import * as FileSystem from "expo-file-system/legacy";
import { supabase } from "./supabase";

export async function uploadCoffeeImage(
  storeId: string,
  localUri: string,
  fileName: string,
): Promise<string> {
  const base64 = await FileSystem.readAsStringAsync(localUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const arrayBuffer = decode(base64);
  const path = `${storeId}/${fileName}`;

  const { error } = await supabase.storage
    .from("coffee-images")
    .upload(path, arrayBuffer, { contentType: "image/jpeg", upsert: true });
  if (error) throw error;

  const { data } = supabase.storage.from("coffee-images").getPublicUrl(path);
  return data.publicUrl;
}
