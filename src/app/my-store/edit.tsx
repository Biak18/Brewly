// src/app/my-store/edit.tsx
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { FormScrollView } from "@/components/ui/FormScrollView";
import { IconButton } from "@/components/ui/IconButton";
import { TimeField } from "@/features/seller/components/TimeField";
import { TimePickerSheet } from "@/features/seller/components/TimePickerSheet";
import { fetchMyStore, updateMyStore } from "@/services/stores";
import { useAuthStore } from "@/stores/authStore";
import { useToastStore } from "@/stores/toastStore";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/theme";
import { getStoreOpenState } from "@/utils/storeHours";
import {
  PinCoords,
  getCurrentCoordinates,
  resolveMapLink,
} from "@/utils/mapLink";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { FieldInput } from "@/components/ui/FieldInput";
import { Controller, useForm, useWatch } from "react-hook-form";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCallback, useEffect, useMemo, useState } from "react";
import { z } from "zod";

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;



export default function EditStoreScreen() {
  const { t } = useTranslation();
  const schema = z
    .object({
      name: z.string().min(1, t("store.enterShopName")),
      address: z.string().min(1, t("store.enterShopAddress")),
      mapLink: z.string(),
      openTime: z
        .string()
        .refine((v) => v === "" || TIME_REGEX.test(v), t("store.useHHMM")),
      closeTime: z
        .string()
        .refine((v) => v === "" || TIME_REGEX.test(v), t("store.useHHMM")),
      kpayPhone: z.string(),
      paymentNote: z.string(),
      contactPhone: z.string(),
    })
    .superRefine((v, ctx) => {
      const oneSet = !!v.openTime !== !!v.closeTime;
      if (oneSet) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [v.openTime ? "closeTime" : "openTime"],
          message: t("store.setBothTimes"),
        });
      }
      if (v.openTime && v.closeTime && v.openTime === v.closeTime) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["closeTime"],
          message: t("store.closingDiffer"),
        });
      }
    });
  type FormValues = z.infer<typeof schema>;
  const { colors, spacing, radius, typography } = useTheme();
  const router = useRouter();
  const userId = useAuthStore((s) => s.session?.user.id);
  const queryClient = useQueryClient();
  const showToast = useToastStore((s) => s.show);

  const { data: store } = useQuery({
    queryKey: ["my-store", userId],
    queryFn: () => fetchMyStore(userId!),
    enabled: !!userId,
  });

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      address: "",
      mapLink: "",
      openTime: "",
      closeTime: "",
      kpayPhone: "",
      paymentNote: "",
      contactPhone: "",
    },
  });

  // Shop pin: lets the app compute real distances for customers. Derived
  // from the saved store until the seller overrides it in this session by
  // pasting a map link or capturing their current location.
  const [pinOverride, setPinOverride] = useState<PinCoords | null>(null);
  const [pinSource, setPinSource] = useState<string | null>(null);
  const [linkError, setLinkError] = useState<string | null>(null);

  useEffect(() => {
    if (store) {
      reset({
        name: store.name ?? "",
        address: store.address ?? "",
        mapLink: "",
        openTime: store.hours?.open ?? "",
        closeTime: store.hours?.close ?? "",
        kpayPhone: store.kpay_phone ?? "",
        paymentNote: store.payment_note ?? "",
        contactPhone: store.contact_phone ?? "",
      });
    }
  }, [store, reset]);

  const save = useMutation({
    mutationFn: ({
      values,
      pin,
    }: {
      values: FormValues;
      pin: PinCoords | null;
    }) => {
      const hours =
        values.openTime && values.closeTime
          ? { open: values.openTime, close: values.closeTime }
          : null;
      return updateMyStore(store!.id, {
        name: values.name.trim(),
        address: values.address.trim(),
        hours,
        kpay_phone: values.kpayPhone.trim() || null,
        payment_note: values.paymentNote.trim() || null,
        contact_phone: values.contactPhone.trim() || null,
        lat: pin?.lat ?? null,
        lng: pin?.lng ?? null,
      });
    },
    onSuccess: async () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ["my-store"] });
      queryClient.invalidateQueries({ queryKey: ["stores"] }); // checkout reads store info from this cache too
      showToast("Store updated");
      router.back();
    },
    onError: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast("Could not save changes");
    },
  });

  // Hours editor: tap-to-pick fields, presets, and a live preview of the
  // exact Open/Closed badge customers see (same storeHours logic).
  const [pickerField, setPickerField] = useState<"open" | "close" | null>(null);
  const openTime = useWatch({ control, name: "openTime" });
  const closeTime = useWatch({ control, name: "closeTime" });
  const mapLinkValue = useWatch({ control, name: "mapLink" });
  const pin = useMemo(
    () =>
      pinOverride ??
      (store?.lat != null && store?.lng != null
        ? { lat: store.lat, lng: store.lng }
        : null),
    [pinOverride, store],
  );
  const draftHours =
    openTime && closeTime ? { open: openTime, close: closeTime } : null;
  const openState = getStoreOpenState(draftHours);
  const isOvernight = !!draftHours && openTime >= closeTime;

  const readMapLink = useCallback(async () => {
    const link = mapLinkValue?.trim() ?? "";
    if (!link) {
      setLinkError(t("store.pasteMapsLinkFirst"));
      return;
    }
    setLinkError(null);
    const resolved = await resolveMapLink(link);
    if (!resolved) {
      setLinkError(t("store.couldNotReadCoords"));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setPinOverride(resolved);
    setPinSource("from your map link");
    Haptics.selectionAsync();
  }, [mapLinkValue, t]);

  const useCurrentLocation = useCallback(async () => {
    const coords = await getCurrentCoordinates();
    if (!coords) {
      showToast(t("store.couldNotGetLocation"));
      return;
    }
    setPinOverride(coords);
    setPinSource("your current location. Stand at the shop before tapping");
    setLinkError(null);
    Haptics.selectionAsync();
  }, [showToast, t]);

  const submit = useCallback(
    async (values: FormValues) => {
      let nextPin = pin;
      if (!nextPin && values.mapLink.trim()) {
        const resolved = await resolveMapLink(values.mapLink);
        if (!resolved) {
          setLinkError(t("store.couldNotReadCoordsTap"));
          return;
        }
        nextPin = resolved;
        setPinOverride(nextPin);
        setPinSource("from your map link");
      }
      setLinkError(null);
      await save.mutateAsync({ values, pin: nextPin });
    },
    [pin, save, t],
  );

  if (!store) return null;

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
          paddingBottom: spacing.lg,
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
        >{t("store.settings")}</Text>
      </View>
      <FormScrollView contentContainerStyle={{ paddingHorizontal: spacing.xl }}>
        <Text
          style={{
            color: colors.muted,
            fontSize: typography.bodySmall,
            marginBottom: spacing.xl,
          }}
        >{t("store.updateDetails")}</Text>

        <Controller
          control={control}
          name="name"
          render={({ field: { value, onChange, onBlur } }) => (
            <FieldInput
              label={t("store.shopName")}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder={t("store.shopName")}
              error={errors.name?.message}
              containerStyle={{ marginBottom: spacing.sm }}
            />
          )}
        />
        <Controller
          control={control}
          name="address"
          render={({ field: { value, onChange, onBlur } }) => (
            <FieldInput
              label={t("store.address")}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder={t("store.address")}
              error={errors.address?.message}
              containerStyle={{ marginBottom: spacing.sm }}
            />
          )}
        />

        <Text
          style={{
            color: colors.muted,
            fontSize: typography.caption,
            fontWeight: "800",
            textTransform: "uppercase",
            letterSpacing: 1,
            marginTop: spacing.md,
            marginBottom: spacing.sm,
          }}
        >{t("store.shopLocation")}</Text>
        <Controller
          control={control}
          name="mapLink"
          render={({ field: { value, onChange, onBlur } }) => (
            <FieldInput
              label={t("store.pasteMapsLink")}
              value={value}
              onChangeText={onChange}
              onBlur={() => {
                onBlur?.();
                readMapLink();
              }}
              autoCapitalize="none"
              autoCorrect={false}
              multiline
              placeholder={t("store.pasteMapsLink")}
              error={linkError ?? undefined}
              inputStyle={{ minHeight: 48, textAlignVertical: "top", paddingTop: 12 }}
            />
          )}
        />
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: spacing.sm,
            marginTop: spacing.sm,
          }}
        >
          <Chip
            label={t("store.findCoordinates")}
            active={false}
            onPress={readMapLink}
          />
          <Chip
            label={t("store.useCurrentLocation")}
            active={false}
            onPress={useCurrentLocation}
          />
        </View>
        {linkError ? (
          <Text style={{ color: colors.danger, fontSize: 11, marginTop: 6 }}>
            {linkError}
          </Text>
        ) : (
          <Text
            style={{ color: colors.muted, fontSize: 11, marginTop: 6 }}
          >
            {pin
              ? t("store.pinSaved", { source: pinSource ? ` (${pinSource})` : "", lat: pin.lat.toFixed(5), lng: pin.lng.toFixed(5) })
              : t("store.noPinYet")}
          </Text>
        )}

        <Text
          style={{
            color: colors.muted,
            fontSize: typography.caption,
            fontWeight: "800",
            textTransform: "uppercase",
            letterSpacing: 1,
            marginTop: spacing.md,
            marginBottom: spacing.sm,
          }}
        >{t("store.openingHours")}</Text>
        <View style={{ flexDirection: "row", gap: spacing.sm }}>
          <Controller
            control={control}
            name="openTime"
            render={({ field: { value } }) => (
              <TimeField
                label={t("store.opens")}
                value={value}
                error={errors.openTime?.message}
                onPress={() => setPickerField("open")}
              />
            )}
          />
          <Controller
            control={control}
            name="closeTime"
            render={({ field: { value } }) => (
              <TimeField
                label={t("store.closes")}
                value={value}
                error={errors.closeTime?.message}
                onPress={() => setPickerField("close")}
              />
            )}
          />
        </View>
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: spacing.sm,
            marginTop: spacing.md,
          }}
        >
          {(
            [
              ["08:00", "17:00", "08–17"],
              ["09:00", "21:00", "09–21"],
              ["10:00", "22:00", "10–22"],
            ] as const
          ).map(([o, c, label]) => (
            <Chip
              key={label}
              label={label}
              active={openTime === o && closeTime === c}
              onPress={() => {
                setValue("openTime", o, { shouldValidate: true });
                setValue("closeTime", c, { shouldValidate: true });
              }}
            />
          ))}
          <Chip
            label={t("store.noHours")}
            active={!openTime && !closeTime}
            onPress={() => {
              setValue("openTime", "");
              setValue("closeTime", "");
            }}
          />
        </View>

        <View
          style={{
            marginTop: spacing.md,
            padding: spacing.md,
            borderRadius: radius.md,
            backgroundColor: colors.surface2,
          }}
        >
          {draftHours ? (
            <>
              <Text
                style={{
                  color: openState.isOpen ? colors.green : colors.muted,
                  fontWeight: "800",
                  fontSize: typography.caption,
                }}
              >
                {openState.isOpen
                  ? t("store.openNow", { time: closeTime })
                  : t("store.closedNow", { time: openTime })}
              </Text>
              {isOvernight && (
                <Text
                  style={{
                    color: colors.muted,
                    fontSize: typography.micro,
                    marginTop: 4,
                  }}
                >{t("store.overnightWindow")}</Text>
              )}
            </>
          ) : (
            <Text
              style={{
                color: colors.muted,
                fontSize: typography.caption,
                fontWeight: "600",
              }}
            >{t("store.noHoursSet")}</Text>
          )}
        </View>

        <Text
          style={{
            color: colors.muted,
            fontSize: typography.caption,
            fontWeight: "800",
            textTransform: "uppercase",
            letterSpacing: 1,
            marginTop: spacing.xl,
            marginBottom: spacing.sm,
          }}
        >{t("store.kpayMmqrReceiving")}</Text>
        <Controller
          control={control}
          name="kpayPhone"
          render={({ field: { value, onChange, onBlur } }) => (
            <FieldInput
              label={t("store.kbzPayNumber")}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder={t("store.kbzPayNumber")}
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
              label={t("store.paymentNoteHint")}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder={t("store.paymentNoteHint")}
              multiline
              inputStyle={{ minHeight: 72, textAlignVertical: "top", paddingTop: 12 }}
            />
          )}
        />

        <Text
          style={{
            color: colors.muted,
            fontSize: typography.caption,
            fontWeight: "800",
            textTransform: "uppercase",
            letterSpacing: 1,
            marginTop: spacing.xl,
            marginBottom: spacing.sm,
          }}
        >{t("store.contactNumber")}</Text>
        <Controller
          control={control}
          name="contactPhone"
          render={({ field: { value, onChange, onBlur } }) => (
            <FieldInput
              label={t("store.phoneCustomersCall")}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder={t("store.phoneCustomersCall")}
              keyboardType="phone-pad"
            />
          )}
        />

        <View style={{ marginVertical: spacing.xxl }}>
          <Button
            label={t("common.saveChanges")}
            onPress={handleSubmit(submit)}
            loading={isSubmitting || save.isPending}
            variant="primary"
          />
        </View>
      </FormScrollView>

      <TimePickerSheet
        visible={pickerField === "open"}
        value={openTime || null}
        onSelect={(t) => setValue("openTime", t, { shouldValidate: true })}
        onClose={() => setPickerField(null)}
      />
      <TimePickerSheet
        visible={pickerField === "close"}
        value={closeTime || null}
        onSelect={(t) => setValue("closeTime", t, { shouldValidate: true })}
        onClose={() => setPickerField(null)}
      />
    </SafeAreaView>
  );
}
