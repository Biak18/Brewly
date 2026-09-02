// src/app/become-seller.tsx
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { FormScrollView } from "@/components/ui/FormScrollView";
import { IconButton } from "@/components/ui/IconButton";
import { assertOnline } from "@/lib/offlineGuard";
import { fetchMyStore, updateMyStore } from "@/services/stores";
import { supabase } from "@/services/supabase";
import { refreshProfile, useAuthStore } from "@/stores/authStore";
import { useTranslation } from "react-i18next";
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
import { FieldInput } from "@/components/ui/FieldInput";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { z } from "zod";



export default function BecomeSellerScreen() {
  const { t } = useTranslation();
  const schema = z.object({
    storeName: z.string().min(1, t("seller.enterShopName")),
    address: z.string().min(1, t("seller.enterShopAddress")),
    mapLink: z.string(),
    openTime: z.string().optional(),
    closeTime: z.string().optional(),
    kpayPhone: z.string(),
    paymentNote: z.string(),
  });
  type FormValues = z.infer<typeof schema>;
  const { colors, spacing, typography } = useTheme();
  const router = useRouter();
  const showToast = useToastStore((s) => s.show);
  const [serverError, setServerError] = useState<string | null>(null);
  const [mapLink, setMapLink] = useState("");
  const [pin, setPin] = useState<PinCoords | null>(null);
  const [pinSource, setPinSource] = useState<string | null>(null);
  const [linkError, setLinkError] = useState<string | null>(null);

  const readMapLink = useCallback(async () => {
    if (!mapLink.trim()) {
      setLinkError(t("seller.pasteMapsLinkFirst"));
      return;
    }
    setLinkError(null);
    const resolved = await resolveMapLink(mapLink);
    if (!resolved) {
      setLinkError(
        "Couldn't read coordinates from that link. Use Share then Copy link in Google Maps, or pin your current location at the shop.",
      );
      return;
    }
    setPin(resolved);
    setPinSource("from your map link");
  }, [mapLink]);

  const useCurrentLocation = useCallback(async () => {
    const coords = await getCurrentCoordinates();
    if (!coords) {
      showToast(t("seller.couldNotGetLocation"));
      return;
    }
    setPin(coords);
    setPinSource("your current location. Stand at the shop before tapping");
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
      try {
        assertOnline();
      } catch (e) {
        setServerError((e as Error).message);
        return;
      }
      setServerError(null);
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
        setServerError(
          error.message.includes("already have a store")
            ? t("seller.alreadyHaveStore")
            : t("seller.couldNotCreateShop"),
        );
        return;
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await refreshProfile();
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
      style={{ flex: 1, paddingTop: spacing.sm, backgroundColor: colors.bg }}
    >
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
        >{t("seller.becomeSellerTitle")}</Text>
      </View>

      <FormScrollView contentContainerStyle={{ padding: spacing.xl }}>
        <Text
          style={{
            color: colors.muted,
            fontSize: typography.bodySmall,
            marginBottom: spacing.lg,
          }}
        >{t("seller.setupShop")}</Text>

        <Controller
          control={control}
          name="storeName"
          render={({ field: { value, onChange, onBlur } }) => (
            <FieldInput
              label={t("seller.shopName")}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder={t("seller.shopName")}
              error={errors.storeName?.message}
              containerStyle={{ marginBottom: spacing.sm }}
            />
          )}
        />

        <Controller
          control={control}
          name="address"
          render={({ field: { value, onChange, onBlur } }) => (
            <FieldInput
              label={t("seller.address")}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder={t("seller.address")}
              error={errors.address?.message}
              containerStyle={{ marginTop: spacing.sm, marginBottom: spacing.sm }}
            />
          )}
        />

        <Controller
          control={control}
          name="mapLink"
          render={({ field: { value, onChange, onBlur } }) => (
            <FieldInput
              label={t("seller.googleMapsLink")}
              value={value}
              onChangeText={(v) => {
                onChange(v);
                setMapLink(v);
              }}
              onBlur={() => {
                onBlur?.();
                readMapLink();
              }}
              autoCapitalize="none"
              autoCorrect={false}
              multiline
              placeholder={t("seller.googleMapsLink")}
              inputStyle={{ minHeight: 48, textAlignVertical: "top", paddingTop: 12 }}
              containerStyle={{ marginTop: spacing.sm, marginBottom: spacing.sm }}
            />
          )}
        />
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
          <Chip label={t("seller.findCoordinates")} active={false} onPress={readMapLink} />
          <Chip
            label={t("seller.useMyLocation")}
            active={false}
            onPress={useCurrentLocation}
          />
        </View>
        <Text style={hintStyle(colors, spacing)}>
          {linkError ? (
            <Text style={{ color: colors.danger }}>{linkError}</Text>
          ) : pin ? (
            <Text style={{ color: colors.green }}>
              {t("seller.pinSaved", { source: pinSource ? ` (${pinSource})` : "", lat: pin.lat.toFixed(5), lng: pin.lng.toFixed(5) })}
            </Text>
          ) : (
            <Text style={{ color: colors.muted }}>{t("seller.addLocationOptional")}</Text>
          )}
        </Text>

        <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.md }}>
          <View style={{ flex: 1 }}>
            <Controller
              control={control}
              name="openTime"
              render={({ field: { value, onChange, onBlur } }) => (
                <FieldInput
                  label={t("seller.opensPlaceholder")}
                  value={value ?? ""}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder={t("seller.opensPlaceholder")}
                  error={errors.openTime?.message}
                />
              )}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Controller
              control={control}
              name="closeTime"
              render={({ field: { value, onChange, onBlur } }) => (
                <FieldInput
                  label={t("seller.closesPlaceholder")}
                  value={value ?? ""}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder={t("seller.closesPlaceholder")}
                  error={errors.closeTime?.message}
                />
              )}
            />
          </View>
        </View>
        <Text style={[hintStyle(colors, spacing), { marginTop: spacing.xs }]}>{t("seller.openingHoursOptional")}</Text>

        <Text
          style={{
            color: colors.muted,
            fontSize: typography.caption,
            fontWeight: "800",
            textTransform: "uppercase",
            letterSpacing: 1,
            marginTop: spacing.lg,
            marginBottom: spacing.sm,
          }}
        >
          KPay / MMQR receiving
        </Text>
        <Controller
          control={control}
          name="kpayPhone"
          render={({ field: { value, onChange, onBlur } }) => (
            <FieldInput
              label={t("seller.kbzPayNumber")}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder={t("seller.kbzPayNumber")}
              keyboardType="phone-pad"
              containerStyle={{ marginBottom: spacing.sm }}
            />
          )}
        />
        <Controller
          control={control}
          name="paymentNote"
          render={({ field: { value, onChange, onBlur } }) => (
            <FieldInput
              label={t("seller.paymentNoteHint")}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder={t("seller.paymentNoteHint")}
              multiline
              inputStyle={{ minHeight: 72, textAlignVertical: "top", paddingTop: 12 }}
              containerStyle={{ marginBottom: spacing.sm }}
            />
          )}
        />
        <Text style={hintStyle(colors, spacing)}>{t("seller.kpayCheckoutHint")}</Text>

        {serverError && (
          <Text style={errorStyle(colors.danger, spacing)}>{serverError}</Text>
        )}
        <Button
          label={t("seller.createMyShop")}
          onPress={handleSubmit(onSubmit)}
          loading={isSubmitting}
          variant="primary"
          style={{ marginTop: spacing.lg }}
        />
      </FormScrollView>
    </SafeAreaView>
  );
}

function hintStyle(
  colors: ReturnType<typeof useTheme>["colors"],
  spacing: ReturnType<typeof useTheme>["spacing"],
) {
  return {
    color: colors.muted,
    fontSize: 12,
    marginTop: 6,
    marginBottom: spacing.sm,
  };
}

function errorStyle(color: string, spacing: ReturnType<typeof useTheme>["spacing"]) {
  return {
    color,
    fontSize: 11,
    marginBottom: spacing.sm,
  };
}
