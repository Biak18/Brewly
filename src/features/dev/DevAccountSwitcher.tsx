// src/features/dev/DevAccountSwitcher.tsx — DEV ONLY, never in production
// One-tap sign-out + sign-in with a test account on a single device.
import { DEV_ACCOUNTS, DevAccount } from "@/config/devAccounts";
import { supabase } from "@/services/supabase";
import { useAuthStore } from "@/stores/authStore";
import { useToastStore } from "@/stores/toastStore";
import { useTheme } from "@/theme";
import { useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

export function DevAccountSwitcher() {
  const { colors, spacing, radius, typography } = useTheme();
  const sessionEmail = useAuthStore((s) => s.session?.user.email ?? "");
  const showToast = useToastStore((s) => s.show);
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);

  if (!__DEV__) return null;
  if (DEV_ACCOUNTS.length === 0) return null;

  const handleSwitch = async (email: string, password: string, label: string) => {
    if (busy) return;
    if (sessionEmail.toLowerCase() === email.toLowerCase()) {
      showToast(`Already signed in as ${label}`);
      return;
    }
    setBusy(email);
    try {
      // No explicit signOut — signInWithPassword replaces the session atomically.
      // Explicit signOut first emits SIGNED_OUT -> handleSession(null) -> RootNavigator
      // briefly shows the sign-in stack (flash). Direct sign-in keeps isLoading=true
      // and shows LoadingScreen instead.
      useAuthStore.setState({ isLoading: true });
      queryClient.clear();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast(`Switched to ${label} · ${email}`);
    } catch (e: any) {
      // Restore loading so UI doesn't stay stuck if sign-in fails
      useAuthStore.setState({ isLoading: false });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast(e?.message ?? "Switch failed — check devAccounts.ts");
    } finally {
      setBusy(null);
    }
  };

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.line,
        borderStyle: "dashed",
        padding: spacing.md,
        marginTop: spacing.xl,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.xs }}>
        <View
          style={{
            backgroundColor: colors.cream,
            paddingHorizontal: 8,
            paddingVertical: 2,
            borderRadius: radius.pill,
          }}
        >
          <Text style={{ color: colors.espresso, fontSize: typography.micro, fontWeight: "800" }}>DEV</Text>
        </View>
        <Text style={{ color: colors.ink, fontWeight: "800", fontSize: typography.bodySmall }}>Quick switch</Text>
        <Text style={{ color: colors.muted, fontSize: typography.micro }}>single-device testing</Text>
      </View>
      <Text style={{ color: colors.muted, fontSize: typography.micro, marginBottom: spacing.sm }}>
        Edit `src/config/devAccounts.ts` with your test passwords. Never ships to prod (`__DEV__` gated).
      </Text>
      <View style={{ gap: spacing.sm }}>
        {DEV_ACCOUNTS.map((acct: DevAccount) => {
          const isCurrent = sessionEmail.toLowerCase() === acct.email.toLowerCase();
          const isBusy = busy === acct.email;
          return (
            <Pressable
              key={acct.email}
              onPress={() => handleSwitch(acct.email, acct.password, acct.label)}
              disabled={!!busy}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                padding: spacing.md,
                borderRadius: radius.md,
                borderWidth: 1,
                borderColor: isCurrent ? colors.green : colors.line,
                backgroundColor: isCurrent ? colors.greenSoft : colors.surface,
                opacity: busy && !isBusy ? 0.6 : 1,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.ink, fontWeight: "700", fontSize: typography.bodySmall }}>
                  {acct.label} {isCurrent ? "· current" : ""}
                </Text>
                <Text style={{ color: colors.muted, fontSize: typography.micro }} numberOfLines={1}>
                  {acct.email} · {acct.role}
                </Text>
              </View>
              {isBusy ? (
                <ActivityIndicator color={colors.espresso} size="small" />
              ) : (
                <Text style={{ color: isCurrent ? colors.green : colors.espresso, fontWeight: "800", fontSize: typography.caption }}>
                  {isCurrent ? "Active" : "Switch"}
                </Text>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
