// src/app/(tabs)/profile.tsx
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { SettingsRow } from "@/components/ui/SettingsRow";
import { ensureNotificationPermission } from "@/lib/notifications";
import { useAuthStore } from "@/stores/authStore";
import { useConfirmDialogStore } from "@/stores/confirmDialogStore";
import { useNotificationStore } from "@/stores/notificationStore";
import { useToastStore } from "@/stores/toastStore";
import { useTheme } from "@/theme";
import { useThemeStore } from "@/theme/themeStore";
import { Stagger } from "@animatereactnative/stagger";
import { Image } from "expo-image";
import { router } from "expo-router";
import {
  Bell,
  Coffee as CoffeeIcon,
  Gift,
  LogOut,
  MapPin,
  Settings,
  Store,
  StoreIcon,
} from "lucide-react-native";
import { useCallback } from "react";
import { ScrollView, Text, View } from "react-native";
import { FadeOutDown, ZoomInEasyDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProfileScreen() {
  const { colors, spacing, typography, radius } = useTheme();
  const profile = useAuthStore((s) => s.profile);
  const session = useAuthStore((s) => s.session);
  const signOut = useAuthStore((s) => s.signOut);
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);
  const showConfirm = useConfirmDialogStore((s) => s.show);
  const pushEnabled = useNotificationStore((s) => s.pushEnabled);
  const setPushEnabled = useNotificationStore((s) => s.setPushEnabled);
  const showToast = useToastStore((s) => s.show);

  // Only flip on when the OS permission is actually granted — otherwise the
  // toggle would claim pushes are on while the system blocks them.
  const togglePush = useCallback(async () => {
    const next = !pushEnabled;
    if (next && !(await ensureNotificationPermission())) {
      showToast("Enable notifications for Brewly in system settings.");
      return;
    }
    setPushEnabled(next);
  }, [pushEnabled, setPushEnabled, showToast]);

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
    <SafeAreaView
      style={{
        flex: 1,
        paddingTop: spacing.sm,
        backgroundColor: colors.bg,
      }}
    >
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
                overflow: "hidden",
              }}
            >
              {profile?.avatar_url ? (
                <Image
                  source={{ uri: profile.avatar_url }}
                  style={{ width: 72, height: 72 }}
                  contentFit="cover"
                />
              ) : (
                <Text
                  style={{
                    color: colors.espresso,
                    fontSize: 28,
                    fontWeight: "800",
                  }}
                >
                  {firstInitial}
                </Text>
              )}
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
            Rewards
          </Text>
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: radius.lg,
              borderWidth: 1,
              borderColor: colors.line,
              paddingHorizontal: spacing.md,
              marginTop: spacing.md,
              marginBottom: spacing.md,
              justifyContent: "center",
            }}
          >
            <SettingsRow
              icon={<Gift size={18} color={colors.muted} strokeWidth={1.8} />}
              label="Loyalty cards"
              onPress={() => router.push("/loyalty")}
            />
            <View style={{ height: 1, backgroundColor: colors.line }} />
            <SettingsRow
              icon={<MapPin size={18} color={colors.muted} strokeWidth={1.8} />}
              label="Delivery addresses"
              onPress={() => router.push("/addresses")}
            />
            <View style={{ height: 1, backgroundColor: colors.line }} />
            <SettingsRow
              icon={
                <Settings size={18} color={colors.muted} strokeWidth={1.8} />
              }
              label="Account settings"
              onPress={() => router.push("/account")}
            />
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
            <SettingsRow
              icon={<Bell size={18} color={colors.muted} strokeWidth={1.8} />}
              label="Push notifications"
              value={pushEnabled ? "On" : "Off"}
              onPress={togglePush}
            />
            <View style={{ height: 1, backgroundColor: colors.line }} />
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

          {profile?.role === "customer" && (
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
                Selling on Brewly
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
                    <Store size={18} color={colors.muted} strokeWidth={1.8} />
                  }
                  label="Become a Seller"
                  onPress={() => {
                    router.push("/become-seller");
                  }}
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
