// src/app/(tabs)/profile.tsx
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { SettingsRow } from "@/components/ui/SettingsRow";
import { useAuthStore } from "@/stores/authStore";
import { useConfirmDialogStore } from "@/stores/confirmDialogStore";
import { useTheme } from "@/theme";
import { useThemeStore } from "@/theme/themeStore";
import { Stagger } from "@animatereactnative/stagger";
import { router } from "expo-router";
import { Coffee as CoffeeIcon, LogOut, StoreIcon } from "lucide-react-native";
import { useCallback } from "react";
import { ScrollView, Text, View } from "react-native";
import { FadeOutDown, ZoomInEasyDown } from "react-native-reanimated";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

export default function ProfileScreen() {
  const { colors, spacing, typography, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const profile = useAuthStore((s) => s.profile);
  const session = useAuthStore((s) => s.session);
  const signOut = useAuthStore((s) => s.signOut);
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);
  const showConfirm = useConfirmDialogStore((s) => s.show);

  const firstInitial = (profile?.full_name ??
    session?.user.email ??
    "?")[0]?.toUpperCase();

  const handleSignOut = useCallback(() => {
    showConfirm({
      title: "Sign out?",
      message: "You'll need to sign back in to place or manage orders.",
      confirmLabel: "Sign out",
      destructive: true,
      onConfirm: () => signOut(),
    });
  }, [showConfirm, signOut]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.bg }}
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          paddingBottom: spacing.xxxl,
        }}
      >
        <Stagger
          stagger={70}
          duration={420}
          entering={() => ZoomInEasyDown.springify()}
          exiting={() => FadeOutDown.springify()}
        >
          <View style={{ alignItems: "center", marginBottom: spacing.xxl }}>
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                backgroundColor: colors.cream,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: spacing.md,
              }}
            >
              <Text
                style={{
                  color: colors.espresso,
                  fontSize: 28,
                  fontWeight: "800",
                }}
              >
                {firstInitial}
              </Text>
            </View>
            <Text
              style={{
                color: colors.ink,
                fontSize: typography.subheading,
                fontWeight: "800",
              }}
            >
              {profile?.full_name ?? "Your account"}
            </Text>
            <Text
              style={{
                color: colors.muted,
                fontSize: typography.caption,
                marginTop: 2,
              }}
            >
              {session?.user.email}
            </Text>
            <View
              style={{
                marginTop: spacing.sm,
                paddingHorizontal: spacing.md,
                paddingVertical: 4,
                borderRadius: radius.pill,
                backgroundColor: colors.greenSoft,
              }}
            >
              <Text
                style={{
                  color: colors.green,
                  fontSize: typography.micro,
                  fontWeight: "800",
                  textTransform: "capitalize",
                }}
              >
                {profile?.role ?? "—"}
              </Text>
            </View>
          </View>

          <Text
            style={{
              color: colors.muted,
              fontSize: typography.caption,
              fontWeight: "800",
              textTransform: "uppercase",
              letterSpacing: 1,
              marginBottom: spacing.xs,
            }}
          >
            Preferences
          </Text>
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: radius.lg,
              borderWidth: 1,
              borderColor: colors.line,
              padding: spacing.md,
              marginBottom: spacing.xl,
            }}
          >
            <Text
              style={{
                color: colors.ink,
                fontSize: typography.bodySmall,
                fontWeight: "600",
                marginBottom: spacing.sm,
              }}
            >
              Appearance
            </Text>
            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              {(["system", "light", "dark"] as const).map((m) => (
                <Chip
                  key={m}
                  label={m.charAt(0).toUpperCase() + m.slice(1)}
                  active={mode === m}
                  onPress={() => setMode(m)}
                />
              ))}
            </View>
          </View>

          {profile?.role === "seller" && (
            <>
              <Text
                style={{
                  color: colors.muted,
                  fontSize: typography.caption,
                  fontWeight: "800",
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  marginBottom: spacing.xs,
                }}
              >
                Shop management
              </Text>
              <View
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: radius.lg,
                  borderWidth: 1,
                  borderColor: colors.line,
                  paddingHorizontal: spacing.md,
                  marginBottom: spacing.xl,
                }}
              >
                <SettingsRow
                  icon={
                    <StoreIcon
                      size={18}
                      color={colors.muted}
                      strokeWidth={1.8}
                    />
                  }
                  label="My Store"
                  onPress={() => router.push("/my-store")}
                />
                <View style={{ height: 1, backgroundColor: colors.line }} />
                <SettingsRow
                  icon={
                    <CoffeeIcon
                      size={18}
                      color={colors.muted}
                      strokeWidth={1.8}
                    />
                  }
                  label="Manage menu"
                  onPress={() => router.push("/seller/menu")}
                />
              </View>
            </>
          )}

          <Button
            label="Sign out"
            onPress={handleSignOut}
            variant="soft"
            icon={
              <LogOut
                size={16}
                color={colors.ink}
                strokeWidth={1.8}
                style={{ marginRight: 6 }}
              />
            }
          />
        </Stagger>
      </ScrollView>
    </SafeAreaView>
  );
}
