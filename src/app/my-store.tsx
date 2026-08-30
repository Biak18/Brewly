// src/app/my-store.tsx
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { IconButton } from "@/components/ui/IconButton";
import { Pulse } from "@/components/ui/Pulse";
import {
  EarningsCard,
  EarningsCardError,
  EarningsCardSkeleton,
} from "@/features/seller/components/EarningsCard";
import { useSellerEarnings } from "@/features/seller/hooks/useSellerEarnings";
import { fetchMyStore } from "@/services/stores";
import { useAuthStore } from "@/stores/authStore";
import { useTranslation } from "react-i18next";
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
import { SafeAreaView } from "react-native-safe-area-context";

export default function MyStoreScreen() {
  const { t } = useTranslation();
  const { colors, spacing, radius, typography } = useTheme();
  const router = useRouter();
  const userId = useAuthStore((s) => s.session?.user.id);
  const { data: store, isLoading } = useQuery({
    queryKey: ["my-store", userId],
    queryFn: () => fetchMyStore(userId!),
    enabled: !!userId,
  });
  const {
    data: earnings,
    isSuccess: earningsLoaded,
    isError: earningsFailed,
  } = useSellerEarnings(store?.id);

  return (
    <SafeAreaView
      style={{
        flex: 1,
        paddingTop: spacing.sm,
        backgroundColor: colors.bg,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: spacing.lg,
        }}
      >
        <IconButton accessibilityLabel={t("common.back")} onPress={() => router.back()}>
          <ChevronLeft size={20} color={colors.ink} strokeWidth={2} />
        </IconButton>
        <Text
          style={{
            color: colors.ink,
            fontSize: typography.subheading,
            fontWeight: "800",
            marginLeft: spacing.md,
          }}
        >{t("store.title")}</Text>
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
          title={t("store.noStoreFound")}
          description={t("store.contactSupport")}
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

          <View style={{ marginTop: spacing.lg }}>
            {!earningsLoaded && !earningsFailed ? (
              <EarningsCardSkeleton />
            ) : earningsLoaded && earnings ? (
              <EarningsCard earnings={earnings} />
            ) : earningsFailed ? (
              <EarningsCardError />
            ) : null}
          </View>

          <View style={{ marginTop: spacing.lg, gap: spacing.sm }}>
            <Button
              label={t("store.manageMenu")}
              onPress={() => router.push("/seller/menu")}
              variant="primary"
            />
            <Button
              label={t("store.managePromotions")}
              onPress={() => router.push("/seller/promotions")}
              variant="soft"
            />
            <Button
              label={t("store.settings")}
              onPress={() => router.push("/my-store/edit")}
              variant="soft"
            />
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
