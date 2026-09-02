// src/services/profile.ts
import { refreshProfile } from "@/stores/authStore";
import { decode } from "base64-arraybuffer";
import * as FileSystem from "expo-file-system/legacy";
import { supabase } from "./supabase";

export async function updateDisplayName(userId: string, fullName: string) {
  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName })
    .eq("id", userId);
  if (error) throw error;
  await refreshProfile();
}

export async function changePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });
  if (error) throw error;
}

// Uploads a local image into the caller's own avatars/<uid>/ folder and
// stores the public URL on the profile.
export async function uploadAvatar(
  userId: string,
  localUri: string,
): Promise<string> {
  const base64 = await FileSystem.readAsStringAsync(localUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const arrayBuffer = decode(base64);
  const path = `${userId}/avatar.jpg`;

  const { error } = await supabase.storage
    .from("avatars")
    .upload(path, arrayBuffer, { contentType: "image/jpeg", upsert: true });
  if (error) throw error;

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  const publicUrl = data.publicUrl;

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ avatar_url: publicUrl })
    .eq("id", userId);
  if (updateError) throw updateError;

  await refreshProfile();
  return publicUrl;
}

export async function deleteAccount() {
  // Avatar files can only be removed through the Storage API, direct
  // storage.objects deletes are blocked by Supabase (SQLSTATE 42501).
  // Best-effort: a leftover orphan file is acceptable if this fails.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    await supabase.storage
      .from("avatars")
      .remove([`${user.id}/avatar.jpg`])
      .catch(() => {});
  }

  const { error } = await supabase.rpc("delete_account");
  if (error) throw error;
}
