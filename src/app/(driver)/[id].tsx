// src/app/(driver)/[id].tsx
import { Button } from "@/components/ui/Button";
import { OrderItemsList } from "@/features/orders/components/OrderItemsList";
import { StatusTimeline } from "@/features/orders/components/StatusTimeline";
import { useOrderTracking } from "@/features/orders/hooks/useOrderTracking";
import { OrderStatus, updateOrderStatus } from "@/services/orders";
import { useToastStore } from "@/stores/toastStore";
import { useTheme } from "@/theme";
import { formatCurrency } from "@/utils/currency";
import { useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function DriverDeliveryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, spacing, radius, typography } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const showToast = useToastStore((s) => s.show);
  const [isAdvancing, setIsAdvancing] = useState(false);

  const { data: order, isLoading } = useOrderTracking(id);

  const advance = async (status: OrderStatus) => {
    if (!order) return;
    setIsAdvancing(true);
    try {
      await updateOrderStatus(order.id, status);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.setQueryData(["orders", "detail", id], {
        ...order,
        status,
      });
      queryClient.invalidateQueries({ queryKey: ["driver-orders"] });
      if (status === "completed") router.dismiss(2);
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast(t("tracking.couldNotUpdatePayment"));
    } finally {
      setIsAdvancing(false);
    }
  };

  if (isLoading || !order) {
    return <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} />;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg }}
      >
        <StatusTimeline status={order.status} fulfillment={order.fulfillment} />

        <View
          style={{
            padding: spacing.lg,
            borderRadius: radius.lg,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.line,
          }}
        >
          <Text
            style={{
              color: colors.muted,
              fontSize: typography.caption,
              marginBottom: spacing.xs,
            }}
          >
            {t("tracking.total")}
          </Text>
          <Text
            style={{
              color: colors.ink,
              fontSize: typography.body,
              fontWeight: "800",
            }}
          >
            {formatCurrency(order.total)}
          </Text>
          {order.delivery_address ? (
            <Text
              style={{
                color: colors.muted,
                fontSize: typography.bodySmall,
                marginTop: spacing.sm,
              }}
            >
              {order.delivery_address}
            </Text>
          ) : null}
        </View>

        <OrderItemsList items={order.order_items} />

        <Button
          label={t("driver.chatWithCustomer")}
          onPress={() => router.push(`/orders/${order.id}/chat` as any)}
          variant="soft"
        />

        {order.status === "driver_assigned" && (
          <Button
            label={t("driver.markOutForDelivery")}
            onPress={() => advance("out_for_delivery")}
            loading={isAdvancing}
            variant="primary"
          />
        )}
        {order.status === "out_for_delivery" && (
          <Button
            label={t("driver.markDelivered")}
            onPress={() => advance("completed")}
            loading={isAdvancing}
            variant="primary"
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
