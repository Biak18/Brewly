// src/app/checkout.tsx — full replacement
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { FulfillmentToggle } from "@/features/checkout/components/FulfillmentToggle";
import { KpayPanel } from "@/features/checkout/components/KpayPanel";
import { OrderSummary } from "@/features/checkout/components/OrderSummary";
import { PaymentMethodRow } from "@/features/checkout/components/PaymentMethodRow";
import { PickupStoreDisplay } from "@/features/checkout/components/PickupStoreDisplay";
import { PickupTimeRow } from "@/features/checkout/components/PickupTimeRow";
import {
  AppliedPromo,
  PromoCodeInput,
} from "@/features/checkout/components/PromoCodeInput";
import { DeliveryAddressPicker } from "@/features/checkout/components/DeliveryAddressPicker";
import { TipJar } from "@/features/checkout/components/TipJar";
import {
  useAddresses,
} from "@/features/account/hooks/useAddresses";
import { formatAddressSnapshot } from "@/services/addresses";
import { attachPayment, placeOrder, DELIVERY_FEE } from "@/services/orders";
import {
  fetchCardForStore,
  finalizeRedemption,
} from "@/services/loyalty";
import { lookupPromoCode } from "@/services/promotions";
import { fetchStoreById } from "@/services/stores";
import { track } from "@/lib/analytics";
import { useCartStore } from "@/stores/cartStore";
import { useNetworkStore } from "@/stores/networkStore";
import { useToastStore } from "@/stores/toastStore";
import { useTheme } from "@/theme";
import { getStoreOpenState } from "@/utils/storeHours";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { Check, ChevronLeft, Gift } from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { Pressable, ScrollView, Text, View } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { z } from "zod";

const checkoutSchema = z
  .object({
    pickupTime: z.enum(["asap", "15", "30", "60"]),
    paymentMethod: z.enum(["cash", "kpay", "mmqr"]),
    paymentRef: z.string().trim(),
  })
  .superRefine((v, ctx) => {
    if (v.paymentMethod !== "cash" && v.paymentRef.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["paymentRef"],
        message: "Enter your transaction ID",
      });
    }
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
  const { colors, spacing, radius, typography } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const items = useCartStore((s) => s.items);  const clearCart = useCartStore((s) => s.clear);
  const isOnline = useNetworkStore((s) => s.isOnline);
  const showToast = useToastStore((s) => s.show);

  const [serverError, setServerError] = useState<string | null>(null);

  const storeId = items[0]?.storeId;

  useEffect(() => {
    track("checkout_started", { store_id: storeId, item_count: items.length });
    // Fired once per checkout visit — cart contents at entry are the props.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const { data: store } = useQuery({
    queryKey: ["store", storeId],
    queryFn: () => fetchStoreById(storeId),
    enabled: !!storeId,
  });

  // Closed shops block checkout. Unknown/missing hours never block.
  const openState = getStoreOpenState(store?.hours);
  const isShopClosed = !!store && openState.isKnown && !openState.isOpen;

  const { data: loyaltyCard } = useQuery({
    queryKey: ["loyalty", "card", storeId],
    queryFn: () => fetchCardForStore(storeId!),
    enabled: !!storeId,
  });
  const hasFreeCoffee =
    (loyaltyCard?.stamps ?? 0) >= 10 && items.length > 0;
  const [redeemFree, setRedeemFree] = useState(false);
  const freeDrinkDiscount =
    redeemFree && hasFreeCoffee
      ? Math.min(...items.map((i) => i.unitPrice))
      : 0;

  const [tip, setTip] = useState(0);
  const [promoInput, setPromoInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<AppliedPromo | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoBusy, setPromoBusy] = useState(false);

  const [fulfillment, setFulfillment] = useState<"pickup" | "delivery">(
    "pickup",
  );
  const { data: addresses = [] } = useAddresses();
  const defaultAddress = addresses.find((a) => a.is_default) ?? addresses[0];
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null,
  );
  // Auto-pick the user's default address once loaded.
  useEffect(() => {
    if (!selectedAddressId && defaultAddress) {
      setSelectedAddressId(defaultAddress.id);
    }
  }, [defaultAddress, selectedAddressId]);
  const selectedAddress =
    addresses.find((a) => a.id === selectedAddressId) ?? null;
  const deliveryFee = fulfillment === "delivery" ? DELIVERY_FEE : 0;
  const needsAddress =
    fulfillment === "delivery" && !selectedAddress;

  const handleApplyPromo = useCallback(async () => {
    if (!storeId) return;
    setPromoBusy(true);
    setPromoError(null);
    try {
      const promo = await lookupPromoCode(storeId, promoInput);
      if (!promo || !promo.code) {
        setPromoError("That code isn't valid for this shop right now.");
        return;
      }
      setAppliedPromo({
        code: promo.code,
        title: promo.title,
        discountPercent: Number(promo.discount_percent),
      });
      setPromoInput("");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      setPromoError("Couldn't check that code — try again.");
    } finally {
      setPromoBusy(false);
    }
  }, [storeId, promoInput]);

  // Promo codes take a percentage off the item subtotal, on top of any
  // loyalty free-drink discount.
  const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const promoDiscount = appliedPromo
    ? Math.round(subtotal * (appliedPromo.discountPercent / 100) * 100) / 100
    : 0;

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      pickupTime: "asap",
      paymentMethod: "cash",
      paymentRef: "",
    },
  });

  const onSubmit = useCallback(
    async (values: CheckoutForm) => {
      if (!storeId || isShopClosed || needsAddress) return;
      setServerError(null);
      try {
        const orderId = await placeOrder({
          storeId,
          fulfillment,
          items,
          loyaltyDiscount: freeDrinkDiscount + promoDiscount,
          tip,
          promoCode: appliedPromo?.code ?? null,
          deliveryAddress: selectedAddress
            ? formatAddressSnapshot(selectedAddress)
            : null,
        });
        track("order_placed", {
          order_id: orderId,
          store_id: storeId,
          item_count: items.length,
          payment_method: values.paymentMethod,
          redeemed_free_coffee: freeDrinkDiscount > 0,
          promo_code: appliedPromo?.code ?? null,
          tip_amount: tip,
          fulfillment,
        });
        if (freeDrinkDiscount > 0) {
          // Order is placed with the discounted total; this just burns the
          // stamps. A rare concurrent-redeem failure must not lose the order —
          // seller sees the discounted total and can adjust manually.
          try {
            await finalizeRedemption(storeId, orderId);
          } catch {
            showToast("Order placed, but free coffee could not be marked used");
          }
        }
        if (values.paymentMethod !== "cash") {
          // Order is already placed; a failed proof attach must not lose it —
          // the seller simply sees it as unpaid and can coordinate manually.
          try {
            await attachPayment(
              orderId,
              values.paymentMethod,
              values.paymentRef.trim(),
            );
          } catch {
            showToast?.("Order placed, but payment proof failed to save");
          }
        }
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
    [
      storeId,
      items,
      clearCart,
      router,
      freeDrinkDiscount,
      promoDiscount,
      tip,
      appliedPromo,
      showToast,
      isShopClosed,
      fulfillment,
      selectedAddress,
      needsAddress,
    ],
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      {!isOnline && (
        <Text
          style={{
            color: colors.danger,
            fontSize: typography.caption,
            textAlign: "center",
            marginTop: spacing.sm,
          }}
        >
          You're offline — connect to place your order.
        </Text>
      )}
      {isShopClosed && (
        <Text
          style={{
            color: colors.danger,
            fontSize: typography.caption,
            fontWeight: "600",
            textAlign: "center",
            marginTop: spacing.sm,
          }}
        >
          {store?.name} is closed right now — opens at {openState.opensAt}.
        </Text>
      )}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: spacing.lg,
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
          <FulfillmentToggle value={fulfillment} onChange={setFulfillment} />
        </Section>
        {fulfillment === "pickup" ? (
          <Section title="Pickup from">
            <PickupStoreDisplay store={store} />
          </Section>
        ) : (
          <Section title="Deliver to">
            <DeliveryAddressPicker
              addresses={addresses}
              selectedId={selectedAddress?.id ?? null}
              onSelect={setSelectedAddressId}
              onManage={() => router.push("/addresses")}
            />
            <Text
              style={{
                color: colors.muted,
                fontSize: typography.micro,
                marginTop: spacing.sm,
              }}
            >
              Flat ${DELIVERY_FEE.toFixed(2)} delivery fee applies.
            </Text>
          </Section>
        )}

        <Section title="Pickup time">
          <Controller
            control={control}
            name="pickupTime"
            render={({ field: { value, onChange } }) => (
              <PickupTimeRow value={value} onChange={onChange} />
            )}
          />
        </Section>

        <Section title="Add a tip">
          <TipJar value={tip} onChange={setTip} />
        </Section>

        <Section title="Payment">
          <Controller
            control={control}
            name="paymentMethod"
            render={({ field: { value, onChange } }) => (
              <PaymentMethodRow value={value} onChange={onChange} />
            )}
          />
          {watch("paymentMethod") !== "cash" && (
            <View style={{ marginTop: spacing.md }}>
              <Controller
                control={control}
                name="paymentRef"
                render={({ field: { value, onChange } }) => (
                  <KpayPanel
                    store={store}
                    method={watch("paymentMethod") as "kpay" | "mmqr"}
                    value={value}
                    onChangeText={onChange}
                    error={errors.paymentRef?.message}
                  />
                )}
              />
            </View>
          )}
        </Section>

        <Section title="Order summary">
          <PromoCodeInput
            value={promoInput}
            onChangeText={setPromoInput}
            applied={appliedPromo}
            error={promoError}
            busy={promoBusy}
            onApply={handleApplyPromo}
            onRemove={() => {
              setAppliedPromo(null);
              setPromoError(null);
            }}
          />
          <View style={{ height: spacing.md }} />
          <OrderSummary
            items={items}
            tip={tip}
            discount={freeDrinkDiscount + promoDiscount}
            fee={deliveryFee}
          />
          {hasFreeCoffee && (
            <Pressable
              onPress={() => setRedeemFree((v) => !v)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginTop: spacing.sm,
                padding: spacing.md,
                borderRadius: radius.lg,
                borderWidth: 1,
                borderColor: redeemFree ? colors.espresso : colors.line,
                backgroundColor: colors.surface,
              }}
            >
              <Gift size={18} color={colors.espresso} strokeWidth={1.8} />
              <View style={{ flex: 1, marginLeft: spacing.sm }}>
                <Text
                  style={{
                    color: colors.ink,
                    fontWeight: "800",
                    fontSize: typography.bodySmall,
                  }}
                >
                  Use my free coffee
                </Text>
                <Text
                  style={{
                    color: colors.muted,
                    fontSize: typography.micro,
                  }}
                >
                  10 stamps · −$
                  {Math.min(
                    ...items.map((i) => i.unitPrice),
                  ).toFixed(2)}{" "}
                  off your cheapest drink
                </Text>
              </View>
              {redeemFree && (
                <Check size={18} color={colors.espresso} strokeWidth={2} />
              )}
            </Pressable>
          )}
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
          disabled={
            items.length === 0 || !storeId || isShopClosed || needsAddress
          }
          variant="primary"
        />
      </View>
    </SafeAreaView>
  );
}
