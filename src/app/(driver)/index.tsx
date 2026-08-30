// src/app/(driver)/index.tsx
import { EmptyState } from "@/components/ui/EmptyState";
import {
  DriverDelivery,
  fetchDriverOrders,
  OrderStatus,
} from "@/services/orders";
import { useAuthStore } from "@/stores/authStore";
import { useTheme } from "@/theme";
import { formatCurrency } from "@/utils/currency";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Package, Truck } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function DriverHome() {
  const { colors, spacing, radius, typography } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const userId = useAuthStore((s) => s.session?.user.id);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["driver-orders", userId],
    queryFn: () => fetchDriverOrders(userId!),
    enabled: !!userId,
  });

  const orders: DriverDelivery[] = data ?? [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
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
        {isError ? (
          <EmptyState
            icon={<Package size={40} color={colors.muted} />}
            title={t("tracking.orderNotFound")}
            description={t("tracking.orderRemoved")}
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
