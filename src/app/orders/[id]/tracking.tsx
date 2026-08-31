// src/app/orders/[id]/tracking.tsx
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { IconButton } from "@/components/ui/IconButton";
import { Pulse } from "@/components/ui/Pulse";
import { OrderItemsList } from "@/features/orders/components/OrderItemsList";
import { ShareReceiptButton } from "@/features/orders/components/ShareReceiptButton";
import { StatusTimeline } from "@/features/orders/components/StatusTimeline";
import { useOrderTracking } from "@/features/orders/hooks/useOrderTracking";
import { OrderReviewSection } from "@/features/reviews/components/OrderReviewSection";
import {
  OrderStatus,
  PaymentStatus,
  assignDriver,
  attachPayment,
  cancelOrder,
  fetchAvailableDrivers,
  setPaymentVerified,
  updateOrderStatus,
} from "@/services/orders";
import { fetchMyStore, fetchStoreById } from "@/services/stores";
import { useAuthStore } from "@/stores/authStore";
import { useConfirmDialogStore } from "@/stores/confirmDialogStore";
import { useToastStore } from "@/stores/toastStore";
import { useTheme } from "@/theme";
import { formatCurrency } from "@/utils/currency";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  CheckCircle2,
  ChevronLeft,
  MessageCircle,
  PackageX,
  XCircle,
} from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { BackHandler, Pressable, Text, TextInput, View } from "react-native";
import {
  KeyboardAwareScrollView,
  KeyboardStickyView,
} from "react-native-keyboard-controller";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

function CompletedBanner() {
  const { t } = useTranslation();
  const { colors, spacing, radius, typography } = useTheme();
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 10 });
    opacity.value = withTiming(1, { duration: 300 });
  }, [scale, opacity]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          marginHorizontal: spacing.xl,
          marginBottom: spacing.lg,
          padding: spacing.md,
          borderRadius: radius.lg,
          backgroundColor: colors.greenSoft,
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.sm,
        },
        style,
      ]}
    >
      <CheckCircle2 size={20} color={colors.green} strokeWidth={2} />
      <Text
        style={{
          color: colors.green,
          fontWeight: "800",
          fontSize: typography.bodySmall,
        }}
      >
        {t("tracking.orderComplete")}
      </Text>
    </Animated.View>
  );
}

function PaymentStatusChip({ status }: { status: PaymentStatus }) {
  const { t } = useTranslation();
  const { colors, radius, typography } = useTheme();
  const label =
    status === "verified"
      ? t("tracking.paid")
      : status === "awaiting_verification"
        ? t("tracking.verifying")
        : t("tracking.unpaid");
  const fg =
    status === "verified"
      ? colors.green
      : status === "awaiting_verification"
        ? colors.espresso
        : colors.muted;
  const bg =
    status === "verified"
      ? colors.greenSoft
      : status === "awaiting_verification"
        ? colors.cream
        : colors.surface2;
  return (
    <View
      style={{
        backgroundColor: bg,
        borderRadius: radius.pill,
        paddingHorizontal: 10,
        paddingVertical: 4,
      }}
    >
      <Text
        style={{
          color: fg,
          fontSize: typography.micro,
          fontWeight: "800",
        }}
      >
        {label}
      </Text>
    </View>
  );
}

export const PICKUP_FLOW: OrderStatus[] = [
  "received",
  "preparing",
  "ready",
  "completed",
];
export const DELIVERY_FLOW: OrderStatus[] = [
  "received",
  "preparing",
  "ready",
  "driver_assigned",
  "out_for_delivery",
  "delivered",
  "completed",
];

function CancelledBanner() {
  const { t } = useTranslation();
  const { colors, spacing, radius, typography } = useTheme();
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 10 });
    opacity.value = withTiming(1, { duration: 300 });
  }, [scale, opacity]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          marginHorizontal: spacing.xl,
          marginBottom: spacing.lg,
          padding: spacing.md,
          borderRadius: radius.lg,
          backgroundColor: colors.surface2,
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.sm,
        },
        style,
      ]}
    >
      <XCircle size={20} color={colors.danger} strokeWidth={2} />
      <Text
        style={{
          color: colors.danger,
          fontWeight: "800",
          fontSize: typography.bodySmall,
        }}
      >
        {t("tracking.orderCancelled")}
      </Text>
    </Animated.View>
  );
}

export default function OrderTrackingScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, spacing, radius, typography } = useTheme();
  const queryClient = useQueryClient();
  const profile = useAuthStore((s) => s.profile);
  const userId = useAuthStore((s) => s.session?.user.id);
  const showConfirm = useConfirmDialogStore((s) => s.show);
  const showToast = useToastStore((s) => s.show);

  const { data: order, isLoading, isError, refetch } = useOrderTracking(id);
  const { data: myStore } = useQuery({
    queryKey: ["my-store", userId],
    queryFn: () => fetchMyStore(userId!),
    enabled: !!userId && profile?.role === "seller",
  });
  const isCustomerOrder = !!order && order.user_id === userId;
  const { data: receiptStore } = useQuery({
    queryKey: ["store", order?.store_id],
    queryFn: () => fetchStoreById(order!.store_id),
    enabled: !!order && isCustomerOrder,
  });

  const [isAdvancing, setIsAdvancing] = useState(false);
  const [paymentRef, setPaymentRef] = useState("");

  const [showDriverPicker, setShowDriverPicker] = useState(false);
  const [availableDrivers, setAvailableDrivers] = useState<
    { id: string; full_name: string | null; phone: string | null }[]
  >([]);
  const [isAssigning, setIsAssigning] = useState(false);

  const openDriverPicker = useCallback(async () => {
    if (!order) return;
    setIsAssigning(true);
    try {
      const list = await fetchAvailableDrivers();
      setAvailableDrivers(list);
      setShowDriverPicker(true);
    } catch {
      showToast(t("tracking.couldNotLoadDrivers"));
    } finally {
      setIsAssigning(false);
    }
  }, [order, showToast, t]);

  const handleAssignDriver = useCallback(
    async (driverId: string) => {
      if (!order) return;
      setIsAssigning(true);
      try {
        await assignDriver(order.id, driverId);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        queryClient.setQueryData(["orders", "detail", id], {
          ...order,
          status: "driver_assigned" as OrderStatus,
          driver_id: driverId,
        });
        setShowDriverPicker(false);
        showToast(t("tracking.driverAssigned"));
      } catch {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        showToast(t("tracking.couldNotAssignDriver"));
      } finally {
        setIsAssigning(false);
      }
    },
    [order, queryClient, id, showToast, t],
  );

  const prevStatusRef = useRef<OrderStatus | undefined>(undefined);
  const pendingSelfChangeRef = useRef<OrderStatus | null>(null);

  useEffect(() => {
    if (!order) return;
    if (order.status === "driver_assigned") return;
    if (prevStatusRef.current && order.status !== prevStatusRef.current) {
      if (pendingSelfChangeRef.current === order.status) {
        pendingSelfChangeRef.current = null;
      } else {
        showToast(t("tracking.updatedOnAnotherDevice"));
      }
    }
    prevStatusRef.current = order.status;
  }, [order, showToast, t]);

  const flow = order?.fulfillment === "delivery" ? DELIVERY_FLOW : PICKUP_FLOW;
  const currentIndex = order ? flow.indexOf(order.status) : -1;
  const nextStatus =
    currentIndex >= 0 && currentIndex < flow.length - 1
      ? flow[currentIndex + 1]
      : null;
  const previousStatus = currentIndex > 0 ? flow[currentIndex - 1] : null;

  const canManage =
    !!order && profile?.role === "seller" && myStore?.id === order.store_id;
  const canRevert = canManage && !!previousStatus;
  // Customers may cancel only their own order, and only before the shop
  // starts preparing it. The RPC enforces this server-side too.
  const canCancel =
    !!order && order.user_id === userId && order.status === "received";

  const isAssignmentStep =
    canManage &&
    nextStatus === "driver_assigned" &&
    order?.fulfillment === "delivery";

  const handleRevert = useCallback(() => {
    if (!order || !previousStatus) return;
    showConfirm({
      title: t("tracking.revertStatusTitle"),
      message: t("tracking.revertStatusMessage", {
        status: t(`tracking.status.${previousStatus}`),
      }),
      confirmLabel: t("tracking.revert"),
      destructive: true,
      onConfirm: async () => {
        pendingSelfChangeRef.current = previousStatus;
        setIsAdvancing(true);
        try {
          await updateOrderStatus(order.id, previousStatus);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          queryClient.setQueryData(["orders", "detail", id], {
            ...order,
            status: previousStatus,
          });
        } catch {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } finally {
          setIsAdvancing(false);
        }
      },
    });
  }, [order, previousStatus, queryClient, id, showConfirm, t]);

  const handleCancel = useCallback(() => {
    if (!order) return;
    showConfirm({
      title: t("tracking.cancelOrderTitle"),
      message: t("tracking.cancelOrderMessage"),
      confirmLabel: t("tracking.cancelOrder"),
      destructive: true,
      onConfirm: async () => {
        setIsAdvancing(true);
        try {
          await cancelOrder(order.id);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          queryClient.setQueryData(["orders", "detail", id], {
            ...order,
            status: "cancelled" as OrderStatus,
          });
          queryClient.invalidateQueries({ queryKey: ["orders"] });
          showToast("Order cancelled");
        } catch {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          showToast("Could not cancel the order");
        } finally {
          setIsAdvancing(false);
        }
      },
    });
  }, [order, showConfirm, queryClient, id, showToast, t]);

  const handleSetPayment = useCallback(
    async (verified: boolean) => {
      if (!order) return;
      setIsAdvancing(true);
      try {
        await setPaymentVerified(order.id, verified);
        Haptics.notificationAsync(
          verified
            ? Haptics.NotificationFeedbackType.Success
            : Haptics.NotificationFeedbackType.Warning,
        );
        queryClient.setQueryData(["orders", "detail", id], {
          ...order,
          payment_status: verified ? "verified" : "unpaid",
          paid_at: verified ? new Date().toISOString() : null,
        });
        queryClient.invalidateQueries({ queryKey: ["orders"] });
        showToast(
          verified
            ? t("tracking.paymentConfirmed")
            : t("tracking.paymentRejected"),
        );
      } catch {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        showToast(t("tracking.couldNotUpdatePayment"));
      } finally {
        setIsAdvancing(false);
      }
    },
    [order, queryClient, id, showToast, t],
  );

  const handleRetryPayment = useCallback(async () => {
    if (!order || !paymentRef.trim()) return;
    setIsAdvancing(true);
    try {
      await attachPayment(
        order.id,
        order.payment_method as "kpay" | "mmqr",
        paymentRef.trim(),
      );
      setPaymentRef("");
      await queryClient.invalidateQueries({
        queryKey: ["orders", "detail", id],
      });
      showToast(t("tracking.paymentProofSubmitted"));
    } catch {
      showToast(t("tracking.couldNotSubmitProof"));
    } finally {
      setIsAdvancing(false);
    }
  }, [order, paymentRef, queryClient, id, showToast, t]);

  useEffect(() => {
    const onBackPress = () => {
      router.back();
      return true;
    };

    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      onBackPress,
    );

    return () => subscription.remove();
  }, [router]);

  const handleAdvance = useCallback(async () => {
    if (!order || !nextStatus) return;
    setIsAdvancing(true);
    pendingSelfChangeRef.current = nextStatus;
    try {
      await updateOrderStatus(order.id, nextStatus);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      queryClient.setQueryData(["orders", "detail", id], {
        ...order,
        status: nextStatus,
      });
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsAdvancing(false);
    }
  }, [order, nextStatus, queryClient, id]);

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.bg,
          paddingTop: insets.top + spacing.xl,
          paddingHorizontal: spacing.xl,
        }}
      >
        <Pulse style={{ height: 4, marginBottom: spacing.xxl }} />
        <Pulse style={{ height: 80, marginBottom: spacing.lg }} />
        <Pulse style={{ height: 80, marginBottom: spacing.lg }} />
        <Pulse style={{ height: 80 }} />
      </View>
    );
  }

  if (isError || !order) {
    return (
      <EmptyState
        icon={<PackageX size={28} color={colors.espresso} strokeWidth={1.8} />}
        title={t("tracking.orderNotFound")}
        description={t("tracking.orderRemoved")}
        actionLabel={t("common.retry")}
        onAction={() => refetch()}
      />
    );
  }

  const totalSavings = order.order_items.reduce(
    (sum, i) =>
      sum + ((i.compare_at_price ?? i.unit_price) - i.unit_price) * i.quantity,
    0,
  );

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
        <IconButton
          accessibilityLabel={t("common.back")}
          onPress={() => router.back()}
        >
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
          {t("tracking.title")}
        </Text>
      </View>

      <KeyboardAwareScrollView
        contentContainerStyle={{ paddingBottom: spacing.xxxl }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ paddingVertical: spacing.xl }}>
          {order.status === "cancelled" ? (
            <CancelledBanner />
          ) : (
            <>
              <StatusTimeline
                status={order.status}
                fulfillment={order.fulfillment}
              />
              <View style={{ marginTop: spacing.md }} />
              {order.status === "completed" && <CompletedBanner />}
              {order.status === "completed" && order.user_id === userId && (
                <View
                  style={{
                    paddingHorizontal: spacing.xl,
                    marginTop: spacing.lg,
                  }}
                >
                  <OrderReviewSection
                    orderId={order.id}
                    items={order.order_items}
                  />
                </View>
              )}
            </>
          )}
        </View>

        <View style={{ paddingHorizontal: spacing.xl }}>
          <Text
            style={{
              color: colors.ink,
              fontSize: typography.body,
              fontWeight: "800",
              marginBottom: spacing.md,
            }}
          >
            {t("tracking.items")}
          </Text>
          <OrderItemsList items={order.order_items} />
          <View
            style={{
              height: 1,
              backgroundColor: colors.line,
              marginVertical: spacing.xl,
            }}
          />
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginBottom: spacing.xs,
            }}
          >
            <Text
              style={{ color: colors.muted, fontSize: typography.bodySmall }}
            >
              {t("tracking.subtotal")}
            </Text>
            <Text style={{ color: colors.ink, fontSize: typography.bodySmall }}>
              {formatCurrency(order.subtotal)}
            </Text>
          </View>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginBottom: spacing.xs,
            }}
          >
            <Text
              style={{ color: colors.muted, fontSize: typography.bodySmall }}
            >
              {t("tracking.tax")}
            </Text>
            <Text style={{ color: colors.ink, fontSize: typography.bodySmall }}>
              {formatCurrency(order.tax)}
            </Text>
          </View>
          {totalSavings > 0 && (
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: spacing.xs,
              }}
            >
              <Text
                style={{ color: colors.green, fontSize: typography.bodySmall }}
              >
                {t("tracking.youSaved")}
              </Text>
              <Text
                style={{
                  color: colors.green,
                  fontSize: typography.bodySmall,
                  fontWeight: "800",
                }}
              >
                {formatCurrency(totalSavings)}
              </Text>
            </View>
          )}
          {(order.discount ?? 0) > 0 && (
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: spacing.xs,
              }}
            >
              <Text
                style={{
                  color: colors.green,
                  fontSize: typography.bodySmall,
                  fontWeight: "600",
                }}
              >
                {order.promo_code
                  ? `Promo В· ${order.promo_code}`
                  : t("tracking.freeCoffeeLoyalty")}
              </Text>
              <Text
                style={{
                  color: colors.green,
                  fontSize: typography.bodySmall,
                  fontWeight: "800",
                }}
              >
                -{formatCurrency(order.discount)}
              </Text>
            </View>
          )}
          {(order.tip ?? 0) > 0 && (
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: spacing.xs,
              }}
            >
              <Text
                style={{ color: colors.muted, fontSize: typography.bodySmall }}
              >
                {t("tracking.tip")}
              </Text>
              <Text
                style={{ color: colors.ink, fontSize: typography.bodySmall }}
              >
                {formatCurrency(order.tip)}
              </Text>
            </View>
          )}
          {(order.delivery_fee ?? 0) > 0 && (
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: spacing.xs,
              }}
            >
              <Text
                style={{ color: colors.muted, fontSize: typography.bodySmall }}
              >
                {t("tracking.deliveryFee")}
              </Text>
              <Text
                style={{ color: colors.ink, fontSize: typography.bodySmall }}
              >
                {formatCurrency(order.delivery_fee)}
              </Text>
            </View>
          )}
          {order.fulfillment === "delivery" && !!order.delivery_address && (
            <>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: spacing.xs,
                }}
              >
                <Text
                  style={{
                    color: colors.muted,
                    fontSize: typography.bodySmall,
                  }}
                >
                  {t("tracking.deliveryTo")}
                </Text>
              </View>
              <Text
                style={{ color: colors.muted, fontSize: typography.caption }}
              >
                {order.delivery_address}
              </Text>
            </>
          )}
          {order.driver_id && order.drivers ? (
            <View
              style={{
                marginTop: spacing.sm,
                padding: spacing.md,
                borderRadius: radius.md,
                backgroundColor: colors.surface2,
              }}
            >
              <Text
                style={{
                  color: colors.muted,
                  fontSize: typography.caption,
                  marginBottom: 2,
                }}
              >
                {t("tracking.driver")}
              </Text>
              <Text
                style={{
                  color: colors.ink,
                  fontSize: typography.bodySmall,
                  fontWeight: "700",
                }}
              >
                {order.drivers.full_name ?? t("tracking.driverAssigned")}
                {order.drivers.phone ? ` · ${order.drivers.phone}` : ""}
              </Text>
            </View>
          ) : null}
          <View
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            <Text
              style={{
                color: colors.ink,
                fontSize: typography.body,
                fontWeight: "800",
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
          </View>

          <View
            style={{
              height: 1,
              backgroundColor: colors.line,
              marginVertical: spacing.xl,
            }}
          />
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text
              style={{
                color: colors.muted,
                fontSize: typography.bodySmall,
                textTransform: "capitalize",
              }}
            >
              Payment В·{" "}
              {order.payment_method === "cash"
                ? t("tracking.cashOnPickup")
                : order.payment_method.toUpperCase()}
            </Text>
            <PaymentStatusChip status={order.payment_status} />
          </View>
          {order.payment_method !== "cash" && !!order.payment_ref && (
            <Text
              selectable
              style={{
                color: colors.muted,
                fontSize: typography.micro,
                marginTop: spacing.xs,
              }}
            >
              {t("tracking.trxId", { ref: order.payment_ref })}
            </Text>
          )}
          {!canManage && order.payment_status === "awaiting_verification" && (
            <Text
              style={{
                color: colors.muted,
                fontSize: typography.micro,
                marginTop: spacing.xs,
              }}
            >
              {t("tracking.waitingPaymentConfirm")}
            </Text>
          )}
        </View>

        {order.status !== "completed" && (
          <View
            style={{ paddingHorizontal: spacing.xl, marginTop: spacing.lg }}
          >
            <Button
              label={
                isCustomerOrder
                  ? t("tracking.talkWithShop")
                  : t("tracking.chatWithCustomer")
              }
              onPress={() =>
                router.push({
                  pathname: "/orders/[id]/chat",
                  params: { id: order.id },
                })
              }
              variant="soft"
              icon={
                <MessageCircle
                  size={18}
                  color={colors.espresso}
                  strokeWidth={1.8}
                />
              }
            />
          </View>
        )}
      </KeyboardAwareScrollView>

      {/* {canManage && nextStatus && (
        <View
          style={{
            padding: spacing.xl,
            borderTopWidth: 1,
            borderTopColor: colors.line,
            backgroundColor: colors.surface,
          }}
        >
          <Button
            label={t("tracking.markAs", { status: t(`tracking.status.${nextStatus}`) })}
            onPress={handleAdvance}
            loading={isAdvancing}
            variant="primary"
          />
        </View>
      )} */}

      {canManage && isAssignmentStep ? (
        <View
          style={{
            padding: spacing.xl,
            borderTopWidth: 1,
            borderTopColor: colors.line,
            backgroundColor: colors.surface,
            gap: spacing.sm,
          }}
        >
          <Button
            label={t("tracking.assignDriver")}
            onPress={openDriverPicker}
            loading={isAssigning}
            variant="primary"
          />
        </View>
      ) : canManage && order.payment_status === "awaiting_verification" ? (
        <View
          style={{
            padding: spacing.xl,
            borderTopWidth: 1,
            borderTopColor: colors.line,
            backgroundColor: colors.surface,
            gap: spacing.sm,
          }}
        >
          <Button
            label={t("tracking.confirmPaymentReceived")}
            onPress={() => handleSetPayment(true)}
            loading={isAdvancing}
            variant="primary"
          />
          <Pressable
            onPress={() => handleSetPayment(false)}
            style={{ alignSelf: "center", paddingVertical: 4 }}
            disabled={isAdvancing}
          >
            <Text
              style={{
                color: colors.danger,
                fontSize: typography.caption,
                fontWeight: "600",
              }}
            >
              {t("tracking.rejectWrongTrx")}
            </Text>
          </Pressable>
        </View>
      ) : isCustomerOrder &&
        order.status === "received" &&
        order.payment_status === "unpaid" &&
        (order.payment_method === "kpay" || order.payment_method === "mmqr") ? (
        <KeyboardStickyView
          style={{
            borderTopWidth: 1,
            borderTopColor: colors.line,
            backgroundColor: colors.surface,
          }}
        >
          <View
            style={{
              padding: spacing.xl,
              gap: spacing.sm,
            }}
          >
            <Text
              style={{
                color: colors.ink,
                fontSize: typography.bodySmall,
                fontWeight: "800",
              }}
            >
              {t("tracking.submitPaymentProof")}
            </Text>
            <TextInput
              value={paymentRef}
              onChangeText={setPaymentRef}
              placeholder={t("tracking.enterTransactionId")}
              placeholderTextColor={colors.muted}
              autoCapitalize="characters"
              style={{
                borderWidth: 1,
                borderColor: colors.line,
                borderRadius: radius.md,
                color: colors.ink,
                paddingHorizontal: spacing.md,
                height: 46,
              }}
            />
            <Button
              label={t("tracking.submitPaymentProof")}
              onPress={handleRetryPayment}
              loading={isAdvancing}
              disabled={!paymentRef.trim()}
              variant="primary"
            />
          </View>
        </KeyboardStickyView>
      ) : order.status === "completed" || order.status === "delivered" ? (
        <View
          style={{
            padding: spacing.xl,
            borderTopWidth: 1,
            borderTopColor: colors.line,
            backgroundColor: colors.surface,
            gap: spacing.sm,
          }}
        >
          {isCustomerOrder && (
            <ShareReceiptButton order={order} storeName={receiptStore?.name} />
          )}
          <Button
            label={t("common.done")}
            onPress={() => router.back()}
            variant="primary"
          />
        </View>
      ) : order.status === "cancelled" ? (
        <View
          style={{
            padding: spacing.xl,
            borderTopWidth: 1,
            borderTopColor: colors.line,
            backgroundColor: colors.surface,
            gap: spacing.sm,
          }}
        >
          {isCustomerOrder && (
            <ShareReceiptButton order={order} storeName={receiptStore?.name} />
          )}
          <Button
            label={t("common.done")}
            onPress={() => router.back()}
            variant="soft"
          />
        </View>
      ) : canManage && nextStatus ? (
        <View
          style={{
            padding: spacing.xl,
            borderTopWidth: 1,
            borderTopColor: colors.line,
            backgroundColor: colors.surface,
          }}
        >
          <Button
            label={t("tracking.markAs", {
              status: t(`tracking.status.${nextStatus}`),
            })}
            onPress={handleAdvance}
            loading={isAdvancing}
            variant="primary"
          />
          {canRevert && (
            <Pressable
              onPress={handleRevert}
              style={{ alignSelf: "center", marginTop: spacing.sm }}
            >
              <Text
                style={{
                  color: colors.muted,
                  fontSize: typography.caption,
                  fontWeight: "600",
                }}
              >
                {t("tracking.revertTo", {
                  status: t(`tracking.status.${previousStatus}`),
                })}
              </Text>
            </Pressable>
          )}
        </View>
      ) : canCancel ? (
        <View
          style={{
            padding: spacing.xl,
            borderTopWidth: 1,
            borderTopColor: colors.line,
            backgroundColor: colors.surface,
          }}
        >
          <Button
            label={t("tracking.cancelOrder")}
            onPress={handleCancel}
            loading={isAdvancing}
            variant="soft"
          />
        </View>
      ) : null}

      {showDriverPicker && (
        <View
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.45)",
            justifyContent: "flex-end",
          }}
        >
          <View
            style={{
              backgroundColor: colors.surface,
              borderTopLeftRadius: radius.xl,
              borderTopRightRadius: radius.xl,
              padding: spacing.xl,
              maxHeight: "70%",
            }}
          >
            <Text
              style={{
                color: colors.ink,
                fontSize: typography.body,
                fontWeight: "800",
                marginBottom: spacing.md,
              }}
            >
              {t("tracking.selectDriver")}
            </Text>
            {availableDrivers.length === 0 ? (
              <Text
                style={{
                  color: colors.muted,
                  fontSize: typography.bodySmall,
                  marginBottom: spacing.md,
                }}
              >
                {t("tracking.noDriversAvailable")}
              </Text>
            ) : (
              availableDrivers.map((d) => (
                <Pressable
                  key={d.id}
                  onPress={() => handleAssignDriver(d.id)}
                  disabled={isAssigning}
                  style={{
                    paddingVertical: spacing.md,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.line,
                  }}
                >
                  <Text
                    style={{
                      color: colors.ink,
                      fontSize: typography.bodySmall,
                      fontWeight: "700",
                    }}
                  >
                    {d.full_name ?? t("tracking.driver")}
                  </Text>
                  {d.phone ? (
                    <Text
                      style={{
                        color: colors.muted,
                        fontSize: typography.caption,
                      }}
                    >
                      {d.phone}
                    </Text>
                  ) : null}
                </Pressable>
              ))
            )}
            <Button
              label={t("common.cancel")}
              onPress={() => setShowDriverPicker(false)}
              variant="soft"
              style={{ marginTop: spacing.md }}
            />
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
