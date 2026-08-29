// src/app/become-seller.tsx
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { FormScrollView } from "@/components/ui/FormScrollView";
import { IconButton } from "@/components/ui/IconButton";
import { fetchMyStore, updateMyStore } from "@/services/stores";
import { supabase } from "@/services/supabase";
import { refreshProfile, useAuthStore } from "@/stores/authStore";
import { useTheme } from "@/theme";
import { useToastStore } from "@/stores/toastStore";
import {
  PinCoords,
  getCurrentCoordinates,
  resolveMapLink,
} from "@/utils/mapLink";
import { zodResolver } from "@hookform/resolvers/zod";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useCallback, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { z } from "zod";

const schema = z.object({
  storeName: z.string().min(1, "Enter your shop name"),
  address: z.string().min(1, "Enter your shop address"),
  mapLink: z.string(),
  openTime: z.string().optional(),
  closeTime: z.string().optional(),
  kpayPhone: z.string(),
  paymentNote: z.string(),
});
type FormValues = z.infer<typeof schema>;

export default function BecomeSellerScreen() {
  const { colors, spacing, radius, typography } = useTheme();
  const router = useRouter();
  const showToast = useToastStore((s) => s.show);
  const [serverError, setServerError] = useState<string | null>(null);
  // Shop pin lets customers see real distances. Optional at creation —
  // sellers can also add it later in Store settings.
  const [mapLink, setMapLink] = useState("");
  const [pin, setPin] = useState<PinCoords | null>(null);
  const [pinSource, setPinSource] = useState<string | null>(null);
  const [linkError, setLinkError] = useState<string | null>(null);

  const readMapLink = useCallback(async () => {
    if (!mapLink.trim()) {
      setLinkError("Paste a Google Maps link first.");
      return;
    }
    setLinkError(null);
    const resolved = await resolveMapLink(mapLink);
    if (!resolved) {
      setLinkError(
        "Couldn't read coordinates from that link. Use Share → Copy link in Google Maps, or pin your current location at the shop.",
      );
      return;
    }
    setPin(resolved);
    setPinSource("from your map link");
  }, [mapLink]);

  const useCurrentLocation = useCallback(async () => {
    const coords = await getCurrentCoordinates();
    if (!coords) {
      showToast("Could not get your location");
      return;
    }
    setPin(coords);
    setPinSource("your current location — stand at the shop before tapping");
    setLinkError(null);
  }, [showToast]);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      storeName: "",
      address: "",
      mapLink: "",
      openTime: "",
      closeTime: "",
      kpayPhone: "",
      paymentNote: "",
    },
  });

  const onSubmit = useCallback(
    async (values: FormValues) => {
      setServerError(null);
      // Resolve the pin before creating the shop so a bad map link fails
      // fast instead of leaving a half-configured store behind.
      let nextPin = pin;
      if (!nextPin && values.mapLink.trim()) {
        const resolved = await resolveMapLink(values.mapLink);
        if (!resolved) {
          setLinkError(
            "Couldn't read coordinates from that link. Tap Find after pasting, or use your current location.",
          );
          return;
        }
        nextPin = resolved;
        setPin(nextPin);
        setPinSource("from your map link");
      }
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
              contact_phone: null,
              lat: nextPin?.lat ?? null,
              lng: nextPin?.lng ?? null,
            });
          }
        }
      } catch {}
      router.replace("/my-store");
    },
    [router, pin],
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

      <FormScrollView contentContainerStyle={{ padding: spacing.xl }}>
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

        <Controller
          control={control}
          name="mapLink"
          render={({ field: { value, onChange } }) => (
            <TextInput
              value={value}
              onChangeText={(v) => {
                onChange(v);
                setMapLink(v);
              }}
              onEndEditing={readMapLink}
              autoCapitalize="none"
              autoCorrect={false}
              multiline
              placeholder="Google Maps link (Share → Copy link)"
              placeholderTextColor={colors.muted}
              style={{
                borderWidth: 1,
                borderColor: linkError ? colors.danger : colors.line,
                minHeight: 48,
                paddingVertical: 12,
                paddingHorizontal: 14,
                fontSize: 14,
                color: colors.ink,
                borderRadius: radius.md,
                marginTop: spacing.sm,
                marginBottom: spacing.xs,
                textAlignVertical: "top",
              }}
            />
          )}
        />
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: spacing.sm,
          }}
        >
          <Chip label="Find coordinates" active={false} onPress={readMapLink} />
          <Chip
            label="Use my current location"
            active={false}
            onPress={useCurrentLocation}
          />
        </View>
        <Text style={{ fontSize: 11, marginTop: 6 }}>
          {linkError ? (
            <Text style={{ color: colors.danger }}>{linkError}</Text>
          ) : pin ? (
            <Text style={{ color: colors.green }}>
              {`Pin saved${pinSource ? ` (${pinSource})` : ""}: ${pin.lat.toFixed(5)}, ${pin.lng.toFixed(5)}`}
            </Text>
          ) : (
            <Text style={{ color: colors.muted }}>
              Optional — but customers can&apos;t see how far your shop is
              without a location pin.
            </Text>
          )}
        </Text>

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
      </FormScrollView>
    </SafeAreaView>
  );
}
