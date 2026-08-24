// src/app/become-seller.tsx
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { fetchMyStore, updateMyStore } from "@/services/stores";
import { supabase } from "@/services/supabase";
import { refreshProfile, useAuthStore } from "@/stores/authStore";
import { useTheme } from "@/theme";
import { zodResolver } from "@hookform/resolvers/zod";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useCallback, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { ScrollView, Text, TextInput, View } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { z } from "zod";

const schema = z.object({
  storeName: z.string().min(1, "Enter your shop name"),
  address: z.string().min(1, "Enter your shop address"),
  openTime: z.string().optional(),
  closeTime: z.string().optional(),
  kpayPhone: z.string(),
  paymentNote: z.string(),
});
type FormValues = z.infer<typeof schema>;

export default function BecomeSellerScreen() {
  const { colors, spacing, radius, typography } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      storeName: "",
      address: "",
      openTime: "",
      closeTime: "",
      kpayPhone: "",
      paymentNote: "",
    },
  });

  const onSubmit = useCallback(
    async (values: FormValues) => {
      setServerError(null);
      const hours =
        values.openTime && values.closeTime
          ? { open: values.openTime, close: values.closeTime }
          : null;
      const { error } = await supabase.rpc("become_seller", {
        p_store_name: values.storeName,
        p_store_address: values.address,
        p_hours: hours,
      });
      if (error) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        // Surfaces the RPC's own "You already have a store" message when relevant,
        // generic fallback otherwise — no reason to hide the specific case.
        setServerError(
          error.message.includes("already have a store")
            ? "You already have a store."
            : "Could not create your shop. Please try again.",
        );
        return;
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await refreshProfile();
      // Attach KPay receiving details without touching the become_seller RPC.
      // Failure here must never block shop creation — sellers can edit later
      // in Store settings.
      try {
        const userId = useAuthStore.getState().session?.user.id;
        if (userId) {
          const store = await fetchMyStore(userId);
          if (store) {
            await updateMyStore(store.id, {
              name: values.storeName.trim(),
              address: values.address.trim(),
              hours,
              kpay_phone: values.kpayPhone.trim() || null,
              payment_note: values.paymentNote.trim() || null,
            });
          }
        }
      } catch {}
      router.replace("/my-store");
    },
    [router],
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
          Become a Seller
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.xl }}>
        <Text
          style={{
            color: colors.muted,
            fontSize: typography.bodySmall,
            marginBottom: spacing.xl,
            lineHeight: 20,
          }}
        >
          Set up your shop to start selling coffee on Brewly. You can add your
          menu right after.
        </Text>

        <Controller
          control={control}
          name="storeName"
          render={({ field: { value, onChange } }) => (
            <TextInput
              value={value}
              onChangeText={onChange}
              placeholder="Shop name"
              placeholderTextColor={colors.muted}
              style={{
                borderWidth: 1,
                borderColor: colors.line,
                height: 48,
                paddingHorizontal: 14,
                fontSize: 14,
                color: colors.ink,
                borderRadius: radius.md,
                marginBottom: spacing.xs,
              }}
            />
          )}
        />
        {errors.storeName && (
          <Text
            style={{
              color: colors.danger,
              fontSize: 11,
              marginBottom: spacing.sm,
            }}
          >
            {errors.storeName.message}
          </Text>
        )}

        <Controller
          control={control}
          name="address"
          render={({ field: { value, onChange } }) => (
            <TextInput
              value={value}
              onChangeText={onChange}
              placeholder="Address"
              placeholderTextColor={colors.muted}
              style={{
                borderWidth: 1,
                borderColor: colors.line,
                height: 48,
                paddingHorizontal: 14,
                fontSize: 14,
                color: colors.ink,
                borderRadius: radius.md,
                marginTop: spacing.sm,
                marginBottom: spacing.xs,
              }}
            />
          )}
        />
        {errors.address && (
          <Text
            style={{
              color: colors.danger,
              fontSize: 11,
              marginBottom: spacing.sm,
            }}
          >
            {errors.address.message}
          </Text>
        )}

        <View
          style={{
            flexDirection: "row",
            gap: spacing.sm,
            marginTop: spacing.sm,
          }}
        >
          <View style={{ flex: 1 }}>
            <Controller
              control={control}
              name="openTime"
              render={({ field: { value, onChange } }) => (
                <TextInput
                  value={value}
                  onChangeText={onChange}
                  placeholder="Opens (e.g. 07:00)"
                  placeholderTextColor={colors.muted}
                  style={{
                    borderWidth: 1,
                    borderColor: colors.line,
                    height: 48,
                    paddingHorizontal: 14,
                    fontSize: 14,
                    color: colors.ink,
                    borderRadius: radius.md,
                  }}
                />
              )}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Controller
              control={control}
              name="closeTime"
              render={({ field: { value, onChange } }) => (
                <TextInput
                  value={value}
                  onChangeText={onChange}
                  placeholder="Closes (e.g. 19:00)"
                  placeholderTextColor={colors.muted}
                  style={{
                    borderWidth: 1,
                    borderColor: colors.line,
                    height: 48,
                    paddingHorizontal: 14,
                    fontSize: 14,
                    color: colors.ink,
                    borderRadius: radius.md,
                  }}
                />
              )}
            />
          </View>
        </View>
        <Text
          style={{
            color: colors.muted,
            fontSize: typography.caption,
            marginTop: spacing.xs,
            marginBottom: spacing.xl,
          }}
        >
          Hours are optional — you can skip these for now.
        </Text>

        <Text
          style={{
            color: colors.muted,
            fontSize: typography.caption,
            fontWeight: "800",
            textTransform: "uppercase",
            letterSpacing: 1,
            marginBottom: spacing.sm,
          }}
        >
          KPay / MMQR receiving
        </Text>
        <Controller
          control={control}
          name="kpayPhone"
          render={({ field: { value, onChange } }) => (
            <TextInput
              value={value}
              onChangeText={onChange}
              placeholder="KBZPay number (e.g. 09XXXXXXXXX)"
              placeholderTextColor={colors.muted}
              keyboardType="phone-pad"
              style={{
                borderWidth: 1,
                borderColor: colors.line,
                height: 48,
                paddingHorizontal: 14,
                fontSize: 14,
                color: colors.ink,
                borderRadius: radius.md,
                marginBottom: spacing.sm,
              }}
            />
          )}
        />
        <Controller
          control={control}
          name="paymentNote"
          render={({ field: { value, onChange } }) => (
            <TextInput
              value={value}
              onChangeText={onChange}
              placeholder="Note for customers (account name, MMQR hint…)"
              placeholderTextColor={colors.muted}
              multiline
              style={{
                borderWidth: 1,
                borderColor: colors.line,
                minHeight: 72,
                padding: 12,
                fontSize: 14,
                color: colors.ink,
                borderRadius: radius.md,
                textAlignVertical: "top",
                marginBottom: spacing.xs,
              }}
            />
          )}
        />
        <Text
          style={{
            color: colors.muted,
            fontSize: typography.micro,
            marginBottom: spacing.xl,
          }}
        >
          Customers see this at checkout when paying by KPay or MMQR. Optional —
          you can change it later in Store settings.
        </Text>

        {serverError && (
          <Text
            style={{
              color: colors.danger,
              fontSize: 11,
              marginBottom: spacing.md,
            }}
          >
            {serverError}
          </Text>
        )}
        <Button
          label="Create my shop"
          onPress={handleSubmit(onSubmit)}
          loading={isSubmitting}
          variant="primary"
        />
      </ScrollView>
    </SafeAreaView>
  );
}
