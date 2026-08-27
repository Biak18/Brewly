// src/lib/notifications.ts
// OS permission helper for the Profile opt-in toggle. The toggle only flips
// on when the user actually grants permission, so it never lies.
import * as Notifications from "expo-notifications";

export async function ensureNotificationPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}
