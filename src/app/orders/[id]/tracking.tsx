// src/app/orders/[id]/tracking.tsx
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { IconButton } from "@/components/ui/IconButton";
import { Pulse } from "@/components/ui/Pulse";
import { OrderItemsList } from "@/features/orders/components/OrderItemsList";
import { StatusTimeline } from "@/features/orders/components/StatusTimeline";
import { useOrderTracking } from "@/features/orders/hooks/useOrderTracking";
import { OrderStatus, updateOrderStatus } from "@/services/orders";
import { useAuthStore } from "@/stores/authStore";
import { useToastStore } from "@/stores/toastStore";
import { useTheme } from "@/theme";
import { useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { CheckCircle2, ChevronLeft, PackageX } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  BackHandler,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
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

const STATUS_FLOW: OrderStatus[] = [
  "received",
  "preparing",
  "ready",
  "completed",
];

export default function OrderTrackingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, spacing, typography } = useTheme();
  const queryClient = useQueryClient();
  const profile = useAuthStore((s) => s.profile);
  const userId = useAuthStore((s) => s.session?.user.id);

  const { data: order, isLoading, isError, refetch } = useOrderTracking(id);
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

  const canManage =
    !!order && (order.user_id === userId || profile?.role === "owner");
  const currentIndex = order ? STATUS_FLOW.indexOf(order.status) : -1;
  const nextStatus =
    currentIndex >= 0 && currentIndex < STATUS_FLOW.length - 1
      ? STATUS_FLOW[currentIndex + 1]
      : null;

  const previousStatus =
    currentIndex > 0 ? STATUS_FLOW[currentIndex - 1] : null;
  const canRevert = profile?.role === "owner" && !!previousStatus;

  const handleRevert = useCallback(() => {
    if (!order || !previousStatus) return;
    Alert.alert(
      "Revert status?",
      `This moves the order back to "${previousStatus}".`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Revert",
          style: "destructive",
          onPress: async () => {
            pendingSelfChangeRef.current = previousStatus;
            setIsAdvancing(true);
            try {
              await updateOrderStatus(order.id, previousStatus);
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Warning,
              );
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
        },
      ],
    );
  }, [order, previousStatus, queryClient, id]);

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
  }, []);

  const handleAdvance = useCallback(async () => {
    if (!order || !nextStatus) return;
    setIsAdvancing(true);
    pendingSelfChangeRef.current = nextStatus;
    try {
      await updateOrderStatus(order.id, nextStatus);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      queryClient.setQueryData(["order", id], { ...order, status: nextStatus });
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
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
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
          <StatusTimeline status={order.status} />
          <View style={{ marginTop: spacing.md }} />
          {order.status === "completed" && <CompletedBanner />}
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

      {order.status === "completed" ? (
        <View
          style={{
            padding: spacing.xl,
            borderTopWidth: 1,
            borderTopColor: colors.line,
            backgroundColor: colors.surface,
          }}
        >
          <Button
            label="Done"
            onPress={() => router.back()}
            variant="primary"
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
      ) : null}
    </SafeAreaView>
  );
}
