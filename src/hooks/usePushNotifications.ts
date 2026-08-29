// src/hooks/usePushNotifications.ts
import { supabase } from "@/services/supabase";
import { useAuthStore } from "@/stores/authStore";
import { useNotificationStore } from "@/stores/notificationStore";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { router, usePathname } from "expo-router";
import { useCallback, useEffect, useRef } from "react";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// True when `pathname` already points at the screen a notification would open.
// Tolerant of query strings / hash / trailing slashes.
function isOnTargetScreen(
  pathname: string,
  orderId: string,
  isChat: boolean,
): boolean {
  const clean = pathname.split(/[?#]/)[0].replace(/\/$/, "");
  return clean === `/orders/${orderId}/${isChat ? "chat" : "tracking"}`;
}

export function usePushNotifications() {
  const userId = useAuthStore((s) => s.session?.user.id);
  const isAuthLoading = useAuthStore((s) => s.isLoading);
  const enabled = useNotificationStore((s) => s.pushEnabled);
  const tokenRef = useRef<string | null>(null);
  const pendingOrderIdRef = useRef<string | null>(null);
  const pendingTypeRef = useRef<string | null>(null);
  const isAuthLoadingRef = useRef(isAuthLoading);
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  useEffect(() => {
    isAuthLoadingRef.current = isAuthLoading;
    pathnameRef.current = pathname;
  }, [isAuthLoading, pathname]);

  useEffect(() => {
    let cancelled = false;

    async function sync() {
      // Opted out or signed out: deregister this device's token so pushes stop.
      if (!userId || !enabled || !Device.isDevice) {
        const stale = tokenRef.current;
        tokenRef.current = null;
        if (stale) {
          await supabase.from("push_tokens").delete().eq("token", stale);
        }
        if (userId && (!enabled || !Device.isDevice)) {
          await supabase.from("push_tokens").delete().eq("user_id", userId);
        }
        return;
      }

      const easExtra = Constants.expoConfig?.extra as
        | { eas?: { projectId?: string } }
        | undefined;
      const projectId = easExtra?.eas?.projectId;
      // Before `npx eas init` populates extra.eas.projectId there is nothing
      // to register — fail quietly instead of letting the SDK throw.
      if (!projectId) return;

      try {
        if (Platform.OS === "android") {
          await Notifications.setNotificationChannelAsync("default", {
            name: "default",
            importance: Notifications.AndroidImportance.DEFAULT,
          });
        }

        const { status: existingStatus } =
          await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== "granted") {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        if (finalStatus !== "granted") return;

        const { data: token } = await Notifications.getExpoPushTokenAsync({
          projectId,
        });
        if (!token || cancelled) return;

        tokenRef.current = token;
        await supabase
          .from("push_tokens")
          .upsert({ user_id: userId, token }, { onConflict: "token" });
      } catch (err) {
        console.warn("Push registration failed", err);
      }
    }

    sync();
    return () => {
      cancelled = true;
    };
  }, [userId, enabled]);

  // Tapping a notification navigates to the order it's about — router is
  // expo-router's imperative singleton, safe to call outside a hook/component tree.
  const openOrderFromResponse = useCallback(
    (response: Notifications.NotificationResponse | null) => {
      const data = response?.notification.request.content.data;
      const orderId = (data?.orderId ?? data?.order_id) as string | undefined;
      if (!orderId) return;
      const isChat = (data?.type as string | undefined) === "chat";

      // Already on the destination screen for this order — don't stack it.
      if (isOnTargetScreen(pathnameRef.current, orderId, isChat)) return;
      // Cold start: the Stack isn't mounted and the session isn't restored
      // yet — park the tap and flush it once auth settles.
      if (isAuthLoadingRef.current) {
        pendingOrderIdRef.current = orderId;
        pendingTypeRef.current = isChat ? "chat" : "order";
        return;
      }
      if (isChat) {
        router.replace({ pathname: "/orders/[id]/chat", params: { id: orderId } });
      } else {
        router.replace(`/orders/${orderId}/tracking`);
      }
    },
    [],
  );

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      openOrderFromResponse,
    );

    Notifications.getLastNotificationResponseAsync()
      .then(openOrderFromResponse)
      .catch((error) => console.warn("Notification response failed", error));

    return () => {
      subscription.remove();
    };
  }, [openOrderFromResponse]);

  useEffect(() => {
    if (isAuthLoading) return;
    const orderId = pendingOrderIdRef.current;
    const type = pendingTypeRef.current;
    if (!orderId) return;
    pendingOrderIdRef.current = null;
    pendingTypeRef.current = null;
    // Signed out (or into another account) — the screens are
    // session-guarded, so a stale tap has nowhere to land.
    if (!userId) return;
    const isChat = type === "chat";
    // Already on the destination screen for this order — don't stack it.
    if (isOnTargetScreen(pathnameRef.current, orderId, isChat)) return;
    if (isChat) {
      router.replace({ pathname: "/orders/[id]/chat", params: { id: orderId } });
    } else {
      router.replace(`/orders/${orderId}/tracking`);
    }
  }, [isAuthLoading, userId]);

  // App is open and every queued push is on screen — badge can be cleared.
  useEffect(() => {
    if (!userId || !enabled) return;
    Notifications.setBadgeCountAsync(0).catch(() => {});
  }, [userId, enabled]);
}
