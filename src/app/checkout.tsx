// src/app/checkout.tsx — full replacement
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { FulfillmentToggle } from "@/features/checkout/components/FulfillmentToggle";
import { OrderSummary } from "@/features/checkout/components/OrderSummary";
import { PaymentMethodRow } from "@/features/checkout/components/PaymentMethodRow";
import { PickupStoreDisplay } from "@/features/checkout/components/PickupStoreDisplay";
import { PickupTimeRow } from "@/features/checkout/components/PickupTimeRow";
import { placeOrder } from "@/services/orders";
import { fetchStoreById } from "@/services/stores";
import { useCartStore } from "@/stores/cartStore";
import { useTheme } from "@/theme";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import React, { useCallback, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { z } from "zod";

const checkoutSchema = z.object({
  pickupTime: z.enum(["asap", "15", "30", "60"]),
  paymentMethod: z.enum(["cash", "card"]),
});
type CheckoutForm = z.infer<typeof checkoutSchema>;

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const { colors, spacing, typography } = useTheme();
  return (
    <View style={{ marginBottom: spacing.xl }}>
      <Text
        style={{
          color: colors.ink,
          fontSize: typography.body,
          fontWeight: "800",
          marginBottom: spacing.sm,
        }}
      >
        {title}
      </Text>
      {children}
    </View>
  );
}

export default function CheckoutScreen() {
  const { colors, spacing, typography } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clear);
  const [serverError, setServerError] = useState<string | null>(null);

  const storeId = items[0]?.storeId;
  const { data: store } = useQuery({
    queryKey: ["store", storeId],
    queryFn: () => fetchStoreById(storeId),
    enabled: !!storeId,
  });

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { pickupTime: "asap", paymentMethod: "cash" },
  });

  const onSubmit = useCallback(
    async (values: CheckoutForm) => {
      if (!storeId) return;
      setServerError(null);
      try {
        const orderId = await placeOrder({
          storeId,
          fulfillment: "pickup",
          items,
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        clearCart();
        router.replace(`/orders/${orderId}/tracking`);
      } catch (err) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setServerError(
          "Something went wrong placing your order. Please try again.",
        );
      }
    },
    [storeId, items, clearCart, router],
  );

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
          Checkout
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: spacing.xl }}
        showsVerticalScrollIndicator={false}
      >
        <Section title="Fulfillment">
          <FulfillmentToggle />
        </Section>
        <Section title="Pickup from">
          <PickupStoreDisplay store={store} />
        </Section>

        <Section title="Pickup time">
          <Controller
            control={control}
            name="pickupTime"
            render={({ field: { value, onChange } }) => (
              <PickupTimeRow value={value} onChange={onChange} />
            )}
          />
        </Section>

        <Section title="Payment">
          <Controller
            control={control}
            name="paymentMethod"
            render={({ field: { value, onChange } }) => (
              <PaymentMethodRow value={value} onChange={onChange} />
            )}
          />
        </Section>

        <Section title="Order summary">
          <OrderSummary items={items} />
        </Section>

        {serverError && (
          <Text
            style={{
              color: colors.danger,
              fontSize: typography.caption,
              marginBottom: spacing.md,
            }}
          >
            {serverError}
          </Text>
        )}
      </ScrollView>

      <View
        style={{
          padding: spacing.xl,
          borderTopWidth: 1,
          borderTopColor: colors.line,
          backgroundColor: colors.surface,
        }}
      >
        <Button
          label={isSubmitting ? "Placing order…" : "Place order"}
          onPress={handleSubmit(onSubmit)}
          loading={isSubmitting}
          disabled={items.length === 0 || !storeId}
          variant="primary"
        />
      </View>
    </View>
  );
}
