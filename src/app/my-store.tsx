// src/app/my-store.tsx
import { EmptyState } from "@/components/ui/EmptyState";
import { IconButton } from "@/components/ui/IconButton";
import { Pulse } from "@/components/ui/Pulse";
import { fetchMyStore } from "@/services/stores";
import { useAuthStore } from "@/stores/authStore";
import { useTheme } from "@/theme";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import {
  ChevronLeft,
  Clock,
  MapPin,
  Store as StoreIcon,
} from "lucide-react-native";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function MyStoreScreen() {
  const { colors, spacing, radius, typography } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const userId = useAuthStore((s) => s.session?.user.id);
  const { data: store, isLoading } = useQuery({
    queryKey: ["my-store", userId],
    queryFn: () => fetchMyStore(userId!),
    enabled: !!userId,
  });

  return (
    <View
      style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          padding: spacing.lg,
        }}
      >
        <IconButton accessibilityLabel="Go back" onPress={() => router.back()}>
          <ChevronLeft size={20} color={colors.ink} strokeWidth={2} />
        </IconButton>
        <Text
          style={{
            color: colors.ink,
            fontSize: typography.subheading,
            fontWeight: "800",
            marginLeft: spacing.md,
          }}
        >
          My Store
        </Text>
      </View>

      {isLoading ? (
        <View style={{ padding: spacing.xl }}>
          <Pulse style={{ height: 140 }} />
        </View>
      ) : !store ? (
        <EmptyState
          icon={
            <StoreIcon size={28} color={colors.espresso} strokeWidth={1.8} />
          }
          title="No store found"
          description="Contact support if you believe this is a mistake."
        />
      ) : (
        <View style={{ padding: spacing.xl }}>
          <View
            style={{
              backgroundColor: colors.surface,
              borderColor: colors.line,
              borderWidth: 1,
              borderRadius: radius.xl,
              padding: spacing.lg,
            }}
          >
            <Text
              style={{
                color: colors.ink,
                fontSize: typography.title,
                fontWeight: "800",
                marginBottom: spacing.md,
              }}
            >
              {store.name}
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                marginBottom: spacing.sm,
              }}
            >
              <MapPin
                size={16}
                color={colors.muted}
                strokeWidth={1.8}
                style={{ marginTop: 2 }}
              />
              <Text
                style={{
                  color: colors.muted,
                  fontSize: typography.bodySmall,
                  marginLeft: spacing.sm,
                  flex: 1,
                }}
              >
                {store.address}
              </Text>
            </View>
            {store.hours && (
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Clock size={16} color={colors.muted} strokeWidth={1.8} />
                <Text
                  style={{
                    color: colors.muted,
                    fontSize: typography.bodySmall,
                    marginLeft: spacing.sm,
                  }}
                >
                  {store.hours.open} – {store.hours.close}
                </Text>
              </View>
            )}
          </View>
          <Text
            style={{
              color: colors.muted,
              fontSize: typography.caption,
              marginTop: spacing.lg,
              textAlign: "center",
            }}
          >
            Editing your store and menu is coming soon.
          </Text>
        </View>
      )}
    </View>
  );
}
