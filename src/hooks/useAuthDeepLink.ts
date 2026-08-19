// src/hooks/useAuthDeepLink.ts
import { supabase } from "@/services/supabase";
import { useAuthStore } from "@/stores/authStore";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { useEffect } from "react";

function parseTokensFromUrl(
  url: string,
): { access_token: string; refresh_token: string } | null {
  const fragment = url.split("#")[1] ?? url.split("?")[1];
  if (!fragment) return null;
  const params = new URLSearchParams(fragment);
  const access_token = params.get("access_token");
  const refresh_token = params.get("refresh_token");
  return access_token && refresh_token ? { access_token, refresh_token } : null;
}

export function useAuthDeepLink() {
  const router = useRouter();

  useEffect(() => {
    const handleUrl = async (url: string | null) => {
      if (!url || !url.includes("reset-password")) return;
      const tokens = parseTokensFromUrl(url);
      if (!tokens) return;

      const { error } = await supabase.auth.setSession(tokens);
      if (error) {
        console.warn("Failed to establish recovery session", error.message);
        return;
      }

      useAuthStore.setState({ isPasswordRecovery: true });
      router.replace("/reset-password");
    };

    Linking.getInitialURL().then(handleUrl);
    const subscription = Linking.addEventListener("url", (event) =>
      handleUrl(event.url),
    );
    return () => subscription.remove();
  }, [router]);
}
