// src/lib/offlineGuard.ts
import i18n from "@/i18n";
import { useNetworkStore } from "@/stores/networkStore";
import { useToastStore } from "@/stores/toastStore";

export function assertOnline(): void {
  if (!useNetworkStore.getState().isOnline) {
    const msg = i18n.t("common.checkConnection");
    try {
      useToastStore.getState().show(msg);
    } catch {
      // No toast store available in some test contexts
    }
    throw new Error(msg);
  }
}
