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
  cancelOrder,
  setPaymentVerified,
  updateOrderStatus,
} from "@/services/orders";
import { fetchMyStore, fetchStoreById } from "@/services/stores";
import { useAuthStore } from "@/stores/authStore";
import { useConfirmDialogStore } from "@/stores/confirmDialogStore";
import { useToastStore } from "@/stores/toastStore";
import { useTheme } from "@/theme";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  CheckCircle2,
  ChevronLeft,
  PackageX,
  XCircle,
} from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import { BackHandler, Pressable, ScrollView, Text, View } from "react-native";
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
        Order complete — enjoy!
      </Text>
    </Animated.View>
  );
}

function PaymentStatusChip({ status }: { status: PaymentStatus }) {
  const { colors, radius, typography } = useTheme();
  const label =
    status === "verified"
      ? "Paid"
      : status === "awaiting_verification"
        ? "Verifying"
        : "Unpaid";
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

const STATUS_FLOW: OrderStatus[] = [
  "received",
  "preparing",
  "ready",
  "completed",
];

function CancelledBanner() {
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
        This order was cancelled
      </Text>
    </Animated.View>
  );
}

export default function OrderTrackingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, spacing, typography } = useTheme();
  const queryClient = useQueryClient();
  const profile = useAuthStore((s) => s.profile);
  const userId = useAuthStore((s) => s.session?.user.id);
  const showConfirm = useConfirmDialogStore((s) => s.show);

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

  const showToast = useToastStore((s) => s.show);
  const prevStatusRef = useRef<OrderStatus | undefined>(undefined);
  const pendingSelfChangeRef = useRef<OrderStatus | null>(null);

  useEffect(() => {
    if (!order) return;
    if (prevStatusRef.current && order.status !== prevStatusRef.current) {
      if (pendingSelfChangeRef.current === order.status) {
        pendingSelfChangeRef.current = null;
      } else {
        showToast("This order was updated on another device");
      }
    }
    prevStatusRef.current = order.status;
  }, [order, showToast]);

  const currentIndex = order ? STATUS_FLOW.indexOf(order.status) : -1;
  const nextStatus =
    currentIndex >= 0 && currentIndex < STATUS_FLOW.length - 1
      ? STATUS_FLOW[currentIndex + 1]
      : null;
  const previousStatus =
    currentIndex > 0 ? STATUS_FLOW[currentIndex - 1] : null;

  const canManage =
    !!order && profile?.role === "seller" && myStore?.id === order.store_id;
  const canRevert = canManage && !!previousStatus;
  // Customers may cancel only their own order, and only before the shop
  // starts preparing it. The RPC enforces this server-side too.
  const canCancel =
    !!order && order.user_id === userId && order.status === "received";

  const handleRevert = useCallback(() => {
    if (!order || !previousStatus) return;
    showConfirm({
      title: "Revert status?",
      message: `This moves the order back to "${previousStatus}".`,
      confirmLabel: "Revert",
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
  }, [order, previousStatus, queryClient, id, showConfirm]);

  const handleCancel = useCallback(() => {
    if (!order) return;
    showConfirm({
      title: "Cancel this order?",
      message: "The shop hasn't started preparing it yet.",
      confirmLabel: "Cancel order",
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
  }, [order, showConfirm, queryClient, id, showToast]);

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
        showToast(verified ? "Payment confirmed" : "Payment rejected");
      } catch {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        showToast("Could not update payment");
      } finally {
        setIsAdvancing(false);
      }
    },
    [order, queryClient, id, showToast],
  );

  useEffect(() => {
    const onBackPress = () => {
      router.dismiss(2);
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
        title="Order not found"
        description="It may have been removed."
        actionLabel="Retry"
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
          accessibilityLabel="Go back"
          onPress={() => router.dismiss(2)}
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
          Order tracking
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: spacing.xxxl }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingVertical: spacing.xl }}>
          {order.status === "cancelled" ? (
            <CancelledBanner />
          ) : (
            <>
              <StatusTimeline status={order.status} />
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
            Items
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
              Subtotal
            </Text>
            <Text style={{ color: colors.ink, fontSize: typography.bodySmall }}>
              ${order.subtotal.toFixed(2)}
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
              Tax
            </Text>
            <Text style={{ color: colors.ink, fontSize: typography.bodySmall }}>
              ${order.tax.toFixed(2)}
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
                You saved
              </Text>
              <Text
                style={{
                  color: colors.green,
                  fontSize: typography.bodySmall,
                  fontWeight: "800",
                }}
              >
                ${totalSavings.toFixed(2)}
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
                  ? `Promo · ${order.promo_code}`
                  : "Free coffee (loyalty)"}
              </Text>
              <Text
                style={{
                  color: colors.green,
                  fontSize: typography.bodySmall,
                  fontWeight: "800",
                }}
              >
                -${order.discount.toFixed(2)}
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
                Tip
              </Text>
              <Text
                style={{ color: colors.ink, fontSize: typography.bodySmall }}
              >
                ${order.tip.toFixed(2)}
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
                Delivery fee
              </Text>
              <Text
                style={{ color: colors.ink, fontSize: typography.bodySmall }}
              >
                ${order.delivery_fee.toFixed(2)}
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
                  Delivery to
                </Text>
              </View>
              <Text
                style={{ color: colors.muted, fontSize: typography.caption }}
              >
                {order.delivery_address}
              </Text>
            </>
          )}
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
              Total
            </Text>
            <Text
              style={{
                color: colors.ink,
                fontSize: typography.body,
                fontWeight: "800",
              }}
            >
              ${order.total.toFixed(2)}
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
              Payment ·{" "}
              {order.payment_method === "cash"
                ? "Cash on pickup"
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
              TRX ID: {order.payment_ref}
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
              Waiting for the shop to confirm your payment.
            </Text>
          )}
        </View>
      </ScrollView>

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
            label={`Mark as ${nextStatus}`}
            onPress={handleAdvance}
            loading={isAdvancing}
            variant="primary"
          />
        </View>
      )} */}

      {canManage && order.payment_status === "awaiting_verification" ? (
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
            label="Confirm payment received"
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
              Reject — wrong TRX ID
            </Text>
          </Pressable>
        </View>
      ) : order.status === "completed" ? (
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
            label="Done"
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
          <Button label="Done" onPress={() => router.back()} variant="soft" />
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
            label={`Mark as ${nextStatus}`}
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
                Revert to {previousStatus}
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
            label="Cancel order"
            onPress={handleCancel}
            loading={isAdvancing}
            variant="soft"
          />
        </View>
      ) : null}
    </SafeAreaView>
  );
}
