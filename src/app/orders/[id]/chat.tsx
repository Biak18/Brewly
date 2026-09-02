// src/app/orders/[id]/chat.tsx
import { IconButton } from "@/components/ui/IconButton";
import { OrderChat } from "@/features/chat/components/OrderChat";
import { useOrderTracking } from "@/features/orders/hooks/useOrderTracking";
import { fetchStoreById } from "@/services/stores";
import { useAuthStore } from "@/stores/authStore";
import { useToastStore } from "@/stores/toastStore";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/theme";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft, Phone } from "lucide-react-native";
import { useCallback, useEffect } from "react";
import { BackHandler, Linking, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function OrderChatScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors, spacing, typography } = useTheme();
  const userId = useAuthStore((s) => s.session?.user.id);
  const showToast = useToastStore((s) => s.show);

  const { data: order, isLoading } = useOrderTracking(id);
  const isCustomerOrder = !!order && order.user_id === userId;
  const { data: receiptStore } = useQuery({
    queryKey: ["store", order?.store_id],
    queryFn: () => fetchStoreById(order!.store_id),
    enabled: !!order && isCustomerOrder,
  });

  const handleCallShop = useCallback(() => {
    const phone = receiptStore?.contact_phone?.trim();
    if (!phone) return;
    Linking.openURL(`tel:${phone}`).catch(() => {
      showToast(t("chat.couldNotOpenDialer"));
    });
  }, [receiptStore, showToast, t]);

  const handleBack = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace("/(tabs)");
  }, []);

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      handleBack();
      return true;
    });
    return () => sub.remove();
  }, [handleBack]);

  const storeName = receiptStore?.name ?? "shop";
  const canCall = isCustomerOrder && !!receiptStore?.contact_phone;
  const hasDriver = !!order?.driver_id;
  const driverName = (order as any)?.drivers?.full_name ?? t("tracking.driver");
  const chatTitle = isCustomerOrder
    ? hasDriver
      ? t("tracking.talkWithDriver") + (driverName ? ` · ${driverName}` : "")
      : t("chat.chatWithShop", { name: storeName })
    : t("chat.chatWithCustomer");

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.surface }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.sm,
          borderBottomWidth: 1,
          borderBottomColor: colors.line,
          backgroundColor: colors.bg,
        }}
      >
        <IconButton accessibilityLabel={t("common.back")} onPress={handleBack}>
          <ChevronLeft size={20} color={colors.ink} strokeWidth={2} />
        </IconButton>
        <Text
          style={{
            color: colors.ink,
            fontSize: typography.subheading,
            fontWeight: "800",
            marginLeft: spacing.md,
            flex: 1,
          }}
          numberOfLines={1}
        >
          {chatTitle}
        </Text>
        {canCall && (
          <IconButton accessibilityLabel={t("chat.callShop", { name: storeName })} onPress={handleCallShop}>
            <Phone size={20} color={colors.espresso} strokeWidth={1.8} />
          </IconButton>
        )}
      </View>

      <View style={{ flex: 1 }}>
        {isLoading || !order ? (
          <View />
        ) : (
          <OrderChat orderId={order.id} currentUserId={userId ?? ""} />
        )}
      </View>
    </SafeAreaView>
  );
}
