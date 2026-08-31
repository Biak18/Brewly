// src/app/(driver)/index.tsx
import { EmptyState } from "@/components/ui/EmptyState";
import {
  Driver,
  DriverDelivery,
  fetchDriverOrders,
  fetchDriverProfile,
  OrderStatus,
  setDriverAvailability,
} from "@/services/orders";
import { useAuthStore } from "@/stores/authStore";
import { useToastStore } from "@/stores/toastStore";
import { useTheme } from "@/theme";
import { formatCurrency } from "@/utils/currency";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Package, Truck } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function DriverHome() {
  const { colors, spacing, radius, typography } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const userId = useAuthStore((s) => s.session?.user.id);
  const queryClient = useQueryClient();
  const showToast = useToastStore((s) => s.show);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["driver-orders", userId],
    queryFn: () => fetchDriverOrders(userId!),
    enabled: !!userId,
  });

  // Availability feeds the seller's driver picker — drivers opt in/out here.
  const { data: driverProfile } = useQuery({
    queryKey: ["driver-profile", userId],
    queryFn: () => fetchDriverProfile(userId!),
    enabled: !!userId,
  });
  const setAvailability = useMutation({
    mutationFn: (next: boolean) => setDriverAvailability(userId!, next),
    onMutate: (next) => {
      queryClient.setQueryData<Driver | null>(
        ["driver-profile", userId],
        (prev) => (prev ? { ...prev, is_available: next } : prev),
      );
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ["driver-profile"] });
      showToast(t("driver.availabilityUpdateFailed"));
    },
  });

  const orders: DriverDelivery[] = data ?? [];
  const isAvailable = driverProfile?.is_available ?? false;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          paddingBottom: spacing.xl,
          gap: spacing.md,
        }}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={() => refetch()}
            tintColor={colors.green}
          />
        }
      >
        {userId ? (
          <View
            style={{
              padding: spacing.lg,
              borderRadius: radius.lg,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.line,
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.md,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: colors.ink,
                  fontSize: typography.body,
                  fontWeight: "800",
                }}
              >
                {t("driver.availableForDeliveries")}
              </Text>
              <Text
                style={{
                  color: colors.muted,
                  fontSize: typography.caption,
                  marginTop: 2,
                }}
              >
                {isAvailable ? t("driver.onlineHint") : t("driver.offlineHint")}
              </Text>
            </View>
            <Switch
              value={isAvailable}
              onValueChange={(next) => setAvailability.mutate(next)}
              disabled={setAvailability.isPending}
              trackColor={{ false: colors.line, true: colors.green }}
              thumbColor={colors.surface}
              accessibilityLabel={t("driver.availableForDeliveries")}
            />
          </View>
        ) : null}
        {isError ? (
          <EmptyState
            icon={<Package size={40} color={colors.muted} />}
            title={t("driver.ordersError")}
            description={t("common.checkConnection")}
          />
        ) : orders.length === 0 && !isLoading ? (
          <EmptyState
            icon={<Truck size={40} color={colors.muted} />}
            title={t("driver.noDeliveries")}
            description=""
          />
        ) : (
          orders.map((o) => (
            <Pressable
              key={o.id}
              onPress={() => router.push(`/(driver)/${o.id}` as any)}
              style={{
                padding: spacing.lg,
                borderRadius: radius.lg,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.line,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: spacing.xs,
                }}
              >
                <Text
                  style={{
                    color: colors.ink,
                    fontSize: typography.body,
                    fontWeight: "800",
                  }}
                >
                  {t(`tracking.status.${o.status as OrderStatus}`)}
                </Text>
                <Text
                  style={{
                    color: colors.green,
                    fontSize: typography.bodySmall,
                    fontWeight: "800",
                  }}
                >
                  {formatCurrency(o.total)}
                </Text>
              </View>
              {o.delivery_address ? (
                <Text
                  style={{
                    color: colors.muted,
                    fontSize: typography.caption,
                  }}
                >
                  {o.delivery_address}
                </Text>
              ) : null}
            </Pressable>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
