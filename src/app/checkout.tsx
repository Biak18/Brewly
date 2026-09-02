// src/app/checkout.tsx: full replacement
import { Button } from "@/components/ui/Button";
import { FormScrollView } from "@/components/ui/FormScrollView";
import { IconButton } from "@/components/ui/IconButton";
import { useAddresses } from "@/features/account/hooks/useAddresses";
import { DeliveryAddressPicker } from "@/features/checkout/components/DeliveryAddressPicker";
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
import { TipJar } from "@/features/checkout/components/TipJar";
import { track } from "@/lib/analytics";
import { formatAddressSnapshot } from "@/services/addresses";
import { fetchCardForStore } from "@/services/loyalty";
import { attachPayment, DELIVERY_FEE, placeOrder } from "@/services/orders";
import { lookupPromoCode } from "@/services/promotions";
import { fetchStoreById } from "@/services/stores";
import { useCartStore } from "@/stores/cartStore";
import { useNetworkStore } from "@/stores/networkStore";
import { useToastStore } from "@/stores/toastStore";
import { useTheme } from "@/theme";
import { formatCurrency } from "@/utils/currency";
import { getStoreOpenState } from "@/utils/storeHours";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { Check, ChevronLeft, Gift } from "lucide-react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { z } from "zod";
import { useTranslation } from "react-i18next";

const checkoutSchema = z
  .object({
    pickupTime: z.enum(["asap", "15", "30", "60"]),
    paymentMethod: z.enum(["cash", "kpay", "mmqr"]),
    paymentRef: z.string().trim(),
  })
  .superRefine((v, ctx) => {
    // Manual proof methods need a transaction ID.
    const needsManualRef = v.paymentMethod !== "cash";
    if (needsManualRef && v.paymentRef.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["paymentRef"],
        message: "checkout.transactionIdRequired",
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
  const { t } = useTranslation();
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clear);
  const isOnline = useNetworkStore((s) => s.isOnline);
  const showToast = useToastStore((s) => s.show);

  const [serverError, setServerError] = useState<string | null>(null);
  const checkoutKeyRef = useRef<string | null>(null);

  const storeId = items[0]?.storeId;

  useEffect(() => {
    track("checkout_started", { store_id: storeId, item_count: items.length });
    // Fired once per checkout visit, cart contents at entry are the props.
     
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
  const hasFreeCoffee = (loyaltyCard?.stamps ?? 0) >= 10 && items.length > 0;
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
  const effectiveAddressId = selectedAddressId ?? defaultAddress?.id ?? null;
  const selectedAddress =
    addresses.find((a) => a.id === effectiveAddressId) ?? null;
  const deliveryFee = fulfillment === "delivery" ? DELIVERY_FEE : 0;
  const needsAddress = fulfillment === "delivery" && !selectedAddress;

  const handleApplyPromo = useCallback(async () => {
    if (!storeId) return;
    setPromoBusy(true);
    setPromoError(null);
    try {
      const promo = await lookupPromoCode(storeId, promoInput);
      if (!promo || !promo.code) {
        setPromoError(t("checkout.promoInvalid"));
        return;
      }
      setAppliedPromo({
        code: promo.code,
        title: promo.title,
        discountPercent: Number(promo.discount_percent),
        scope: promo.scope,
        categoryId: promo.category_id,
        coffeeId: promo.coffee_id,
      });
      setPromoInput("");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      setPromoError(t("checkout.promoCheckFailed"));
    } finally {
      setPromoBusy(false);
    }
  }, [storeId, promoInput]);

  // Promo codes apply only to the items eligible for the selected promotion.
  const eligiblePromoItems = appliedPromo
    ? items
        .filter(
          (item) =>
            appliedPromo.scope === "all" ||
            (appliedPromo.scope === "coffee" &&
              item.coffeeId === appliedPromo.coffeeId) ||
            (appliedPromo.scope === "category" &&
              item.categoryId === appliedPromo.categoryId),
        )
        .map((item) => item.name)
    : undefined;
  const eligiblePromoSubtotal = appliedPromo
    ? items
        .filter(
          (item) =>
            appliedPromo.scope === "all" ||
            (appliedPromo.scope === "coffee" &&
              item.coffeeId === appliedPromo.coffeeId) ||
            (appliedPromo.scope === "category" &&
              item.categoryId === appliedPromo.categoryId),
        )
        .reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
    : 0;
  const promoDiscount = appliedPromo
    ? Math.round(
        eligiblePromoSubtotal * (appliedPromo.discountPercent / 100) * 100,
      ) / 100
    : 0;

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      pickupTime: "asap",
      paymentMethod: "cash",
      paymentRef: "",
    },
  });
  const paymentMethod = useWatch({ control, name: "paymentMethod" });

  const onSubmit = useCallback(
    async (values: CheckoutForm) => {
      if (!storeId || isShopClosed || needsAddress) return;
      setServerError(null);
      if (!checkoutKeyRef.current) {
        checkoutKeyRef.current = `checkout-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      }
      try {
        const orderId = await placeOrder({
          storeId,
          fulfillment,
          items,
          loyaltyDiscount: freeDrinkDiscount + promoDiscount,
          tip,
          promoCode: appliedPromo?.code ?? null,
          redeemLoyalty: freeDrinkDiscount > 0,
          idempotencyKey: checkoutKeyRef.current,
          deliveryAddress:
            fulfillment === "delivery" && selectedAddress
              ? formatAddressSnapshot(selectedAddress)
              : null,
          deliveryLat: fulfillment === "delivery" ? (selectedAddress?.lat ?? null) : null,
          deliveryLng: fulfillment === "delivery" ? (selectedAddress?.lng ?? null) : null,
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
        if (values.paymentMethod === "mmqr" || values.paymentMethod === "kpay") {
          // Manual proof path. Order is already placed; a failed proof attach
          // must not lose it, the seller sees it unpaid and coordinates.
          try {
            await attachPayment(
              orderId,
              values.paymentMethod,
              values.paymentRef.trim(),
            );
          } catch {
            showToast?.(t("checkout.paymentProofFailed"));
          }
        }
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        clearCart();
        router.replace(`/orders/${orderId}/tracking`);
      } catch (error) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setServerError(
          error instanceof Error && error.message.includes("Menu price changed")
            ? t("checkout.menuChanged")
            : t("checkout.orderError"),
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
  const submitOrder = useCallback(() => {
    void handleSubmit(onSubmit)();
  }, [handleSubmit, onSubmit]);

  return (
    <SafeAreaView
      style={{
        flex: 1,
        paddingTop: spacing.sm,
        backgroundColor: colors.bg,
      }}
    >
      {!isOnline && (
        <Text
          style={{
            color: colors.danger,
            fontSize: typography.caption,
            textAlign: "center",
            marginTop: spacing.sm,
          }}
        >
          {t("checkout.offline")}
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
          {t("checkout.closed", { name: store?.name, time: openState.opensAt })}
        </Text>
      )}
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
        >
          {t("checkout.title")}
        </Text>
      </View>

      <FormScrollView
        contentContainerStyle={{ padding: spacing.xl }}
        showsVerticalScrollIndicator={false}
      >
        <Section title={t("checkout.fulfillment")}>
          <FulfillmentToggle value={fulfillment} onChange={setFulfillment} />
        </Section>
        {fulfillment === "pickup" ? (
          <Section title={t("checkout.pickupFrom")}>
            <PickupStoreDisplay store={store} />
          </Section>
        ) : (
          <Section title={t("checkout.deliverTo")}>
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
              {t("checkout.freeDeliveryApplies")}
            </Text>
          </Section>
        )}

        <Section title={t("checkout.pickupTime")}>
          <Controller
            control={control}
            name="pickupTime"
            render={({ field: { value, onChange } }) => (
              <PickupTimeRow
                value={value}
                onChange={onChange}
                hours={store?.hours}
              />
            )}
          />
        </Section>

        <Section title={t("checkout.addTip")}>
          <TipJar value={tip} onChange={setTip} />
        </Section>

        <Section title={t("checkout.payment")}>
          <Controller
            control={control}
            name="paymentMethod"
            render={({ field: { value, onChange } }) => (
              <PaymentMethodRow value={value} onChange={onChange} />
            )}
          />
          {paymentMethod !== "cash" && (
              <View style={{ marginTop: spacing.md }}>
                <Controller
                  control={control}
                  name="paymentRef"
                  render={({ field: { value, onChange } }) => (
                    <KpayPanel
                      store={store}
                      method={paymentMethod as "kpay" | "mmqr"}
                      value={value}
                      onChangeText={onChange}
                      error={errors.paymentRef?.message ? t(errors.paymentRef.message) : undefined}
                    />
                  )}
                />
              </View>
            )}
        </Section>

        <Section title={t("checkout.orderSummary")}>
          <PromoCodeInput
            value={promoInput}
            onChangeText={setPromoInput}
            applied={appliedPromo}
            error={promoError}
            busy={promoBusy}
            eligibleItems={eligiblePromoItems}
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
                  {t("checkout.useFreeCoffee")}
                </Text>
                <Text
                  style={{
                    color: colors.muted,
                    fontSize: typography.micro,
                  }}
                >
                  {t("checkout.freeCoffeeHint", {
                    price: formatCurrency(
                      Math.min(...items.map((i) => i.unitPrice)),
                    ),
                  })}
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
      </FormScrollView>

      <View
        style={{
          padding: spacing.xl,
          borderTopWidth: 1,
          borderTopColor: colors.line,
          backgroundColor: colors.surface,
        }}
      >
        <Button
          label={isSubmitting ? t("checkout.placingOrder") : t("checkout.placeOrder")}
          onPress={submitOrder}
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
