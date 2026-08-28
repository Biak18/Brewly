// src/hooks/usePushNotifications.ts
import { supabase } from "@/services/supabase";
import { useAuthStore } from "@/stores/authStore";
import { useNotificationStore } from "@/stores/notificationStore";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { useEffect, useRef } from "react";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function usePushNotifications() {
  const userId = useAuthStore((s) => s.session?.user.id);
  const enabled = useNotificationStore((s) => s.pushEnabled);
  const tokenRef = useRef<string | null>(null);

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
  useEffect(() => {
    let cancelled = false;

    function openOrderFromResponse(
      response: Notifications.NotificationResponse | null,
    ) {
      if (cancelled || !response) return;
      const data = response.notification.request.content.data;
      const orderId = (data?.orderId ?? data?.order_id) as string | undefined;
      if (orderId) router.push(`/orders/${orderId}/tracking`);
    }

    const subscription = Notifications.addNotificationResponseReceivedListener(
      openOrderFromResponse,
    );

    Notifications.getLastNotificationResponseAsync()
      .then(openOrderFromResponse)
      .catch((error) => console.warn("Notification response failed", error));

    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, []);
}
