// src/app/addresses.tsx
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { IconButton } from "@/components/ui/IconButton";
import {
  Address,
  useAddresses,
  useDeleteAddress,
  useSaveAddress,
  useSetDefaultAddress,
} from "@/features/account/hooks/useAddresses";
import { useConfirmDialogStore } from "@/stores/confirmDialogStore";
import { useToastStore } from "@/stores/toastStore";
import { useTheme } from "@/theme";
import { Chip } from "@/components/ui/Chip";
import { FieldInput } from "@/components/ui/FieldInput";
import {
  getCurrentCoordinates,
  PinCoords,
  resolveMapLink,
} from "@/utils/mapLink";
import { zodResolver } from "@hookform/resolvers/zod";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { ChevronLeft, MapPin, Pencil, Trash2 } from "lucide-react-native";
import { useCallback, useState } from "react";
import {
  Controller,
  FormProvider,
  useForm,
  useFormContext,
} from "react-hook-form";
import {
  FlatList,
  Pressable,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { z } from "zod";
import { useTranslation } from "react-i18next";

const addressSchema = z.object({
  label: z.string().trim().min(1, "addresses.labelRequired"),
  fullName: z.string().trim().min(1, "addresses.recipientRequired"),
  phone: z.string().trim().min(5, "addresses.phoneRequired"),
  address: z.string().trim().min(6, "addresses.addressRequired"),
});
type AddressForm = z.infer<typeof addressSchema>;

function AddressFormFields() {
  const { t } = useTranslation();
  const {
    control,
    formState: { errors },
  } = useFormContext<AddressForm>();

  return (
    <>
      <Controller
        control={control}
        name="label"
        render={({ field: { value, onChange, onBlur } }) => (
          <FieldInput
            label={t("addresses.label")}
            value={value ?? ""}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder={t("addresses.labelPlaceholder")}
            error={errors.label ? t(errors.label.message ?? "") : undefined}
            containerStyle={{ marginBottom: 12 }}
          />
        )}
      />
      <Controller
        control={control}
        name="fullName"
        render={({ field: { value, onChange, onBlur } }) => (
          <FieldInput
            label={t("addresses.recipientPlaceholder")}
            value={value ?? ""}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder={t("addresses.recipientPlaceholder")}
            error={errors.fullName ? t(errors.fullName.message ?? "") : undefined}
            containerStyle={{ marginBottom: 12 }}
          />
        )}
      />
      <Controller
        control={control}
        name="phone"
        render={({ field: { value, onChange, onBlur } }) => (
          <FieldInput
            label={t("addresses.phonePlaceholder")}
            value={value ?? ""}
            onChangeText={onChange}
            onBlur={onBlur}
            keyboardType="phone-pad"
            placeholder={t("addresses.phonePlaceholder")}
            error={errors.phone ? t(errors.phone.message ?? "") : undefined}
            containerStyle={{ marginBottom: 12 }}
          />
        )}
      />
      <Controller
        control={control}
        name="address"
        render={({ field: { value, onChange, onBlur } }) => (
          <FieldInput
            label={t("addresses.addressPlaceholder")}
            value={value ?? ""}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder={t("addresses.addressPlaceholder")}
            error={errors.address ? t(errors.address.message ?? "") : undefined}
            multiline
            inputStyle={{ minHeight: 80, textAlignVertical: "top", paddingTop: 12 }}
            containerStyle={{ marginBottom: 4 }}
          />
        )}
      />
    </>
  );
}

function AddressCard({
  address,
  onEdit,
}: {
  address: Address;
  onEdit: (a: Address) => void;
}) {
  const { colors, radius, spacing, typography } = useTheme();
  const { t } = useTranslation();
  const setDefault = useSetDefaultAddress();
  const deleteAddress = useDeleteAddress();
  const showConfirm = useConfirmDialogStore((s) => s.show);
  const showToast = useToastStore((s) => s.show);

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        padding: spacing.md,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: address.is_default ? colors.espresso : colors.line,
        backgroundColor: colors.surface,
        marginBottom: spacing.sm,
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: radius.md,
          backgroundColor: colors.cream,
          alignItems: "center",
          justifyContent: "center",
          marginRight: spacing.md,
        }}
      >
        <MapPin size={18} color={colors.espresso} strokeWidth={1.8} />
      </View>
      <View style={{ flex: 1 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.sm,
          }}
        >
          <Text
            style={{
              color: colors.ink,
              fontWeight: "800",
              fontSize: typography.bodySmall,
            }}
          >
            {address.label}
          </Text>
          {address.is_default && (
            <View
              style={{
                backgroundColor: colors.greenSoft,
                borderRadius: radius.pill,
                paddingHorizontal: 8,
                paddingVertical: 2,
              }}
            >
                <Text
                  style={{
                    color: colors.green,
                    fontSize: typography.micro,
                    fontWeight: "800",
                  }}
                >
                  {t("addresses.default")}
                </Text>
            </View>
          )}
        </View>
        {!!address.full_name && (
          <Text
            style={{
              color: colors.ink,
              fontSize: typography.caption,
              marginTop: 2,
            }}
            numberOfLines={1}
          >
            {address.full_name}
            {address.phone ? ` · ${address.phone}` : ""}
          </Text>
        )}
        <Text
          style={{
            color: colors.muted,
            fontSize: typography.caption,
            marginTop: 2,
          }}
          numberOfLines={2}
        >
          {address.address}
        </Text>
        {address.lat != null && address.lng != null && (
          <Text style={{ color: colors.green, fontSize: typography.micro, marginTop: 2 }}>
            📍 {address.lat.toFixed(4)}, {address.lng.toFixed(4)}
          </Text>
        )}
        {!address.is_default && (
          <Pressable
            onPress={() => setDefault.mutate(address.id)}
            hitSlop={8}
            style={{ marginTop: 6, alignSelf: "flex-start" }}
          >
            <Text
              style={{
                color: colors.espresso2,
                fontSize: typography.micro,
                fontWeight: "800",
              }}
                >
                  {t("addresses.setAsDefault")}
                </Text>
          </Pressable>
        )}
      </View>
      <View style={{ flexDirection: "row", gap: 2 }}>
        <IconButton
          accessibilityLabel={t("addresses.editLabel", { label: address.label })}
          onPress={() => onEdit(address)}
        >
          <Pencil size={16} color={colors.muted} strokeWidth={1.8} />
        </IconButton>
        <IconButton
          accessibilityLabel={t("addresses.deleteLabel", { label: address.label })}
          onPress={() =>
            showConfirm({
              title: t("addresses.deleteTitle", { label: address.label }),
              message: t("addresses.deleteMessage"),
              confirmLabel: t("common.delete"),
              destructive: true,
              onConfirm: async () => {
                try {
                  await deleteAddress.mutateAsync(address.id);
                  showToast(t("addresses.toastDeleted"));
                } catch {
                  showToast(t("addresses.toastDeleteFailed"));
                }
              },
            })
          }
        >
          <Trash2 size={16} color={colors.danger} strokeWidth={1.8} />
        </IconButton>
      </View>
    </View>
  );
}

export default function AddressesScreen() {
  const { colors, spacing, typography } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const showToast = useToastStore((s) => s.show);
  const { data: addresses = [], isLoading } = useAddresses();
  const saveAddress = useSaveAddress();

  const [sheetVisible, setSheetVisible] = useState(false);
  const [editing, setEditing] = useState<Address | null>(null);
  const [mapLink, setMapLink] = useState("");
  const [pin, setPin] = useState<PinCoords | null>(null);
  const [pinSource, setPinSource] = useState<string | null>(null);
  const [linkError, setLinkError] = useState<string | null>(null);

  const form = useForm<AddressForm>({
    resolver: zodResolver(addressSchema),
    defaultValues: { label: "", fullName: "", phone: "", address: "" },
  });
  const [makeDefault, setMakeDefault] = useState(false);

  const readMapLink = useCallback(async () => {
    if (!mapLink.trim()) {
      setLinkError(t("store.pasteMapsLinkFirst"));
      return;
    }
    setLinkError(null);
    const resolved = await resolveMapLink(mapLink);
    if (!resolved) {
      setLinkError(t("store.couldNotReadCoordsTap"));
      return;
    }
    setPin(resolved);
    setPinSource("from map link");
  }, [mapLink, t]);

  const useCurrentLocation = useCallback(async () => {
    const coords = await getCurrentCoordinates();
    if (!coords) {
      showToast(t("store.couldNotGetLocation"));
      return;
    }
    setPin(coords);
    setPinSource("current location");
    setLinkError(null);
  }, [showToast, t]);

  const openAdd = useCallback(() => {
    setEditing(null);
    setMakeDefault((addresses?.length ?? 0) === 0);
    setMapLink("");
    setPin(null);
    setPinSource(null);
    setLinkError(null);
    form.reset({ label: "", fullName: "", phone: "", address: "" });
    setSheetVisible(true);
  }, [addresses, form]);

  const openEdit = useCallback(
    (a: Address) => {
      setEditing(a);
      setMakeDefault(!!a.is_default);
      setMapLink("");
      setPin(a.lat != null && a.lng != null ? { lat: a.lat, lng: a.lng } : null);
      setPinSource(a.lat != null ? "saved" : null);
      setLinkError(null);
      form.reset({
        label: a.label,
        fullName: a.full_name,
        phone: a.phone,
        address: a.address,
      });
      setSheetVisible(true);
    },
    [form],
  );

  const onSubmit = useCallback(
    async (values: AddressForm) => {
      let nextPin = pin;
      if (!nextPin && mapLink.trim()) {
        const resolved = await resolveMapLink(mapLink);
        if (resolved) {
          nextPin = resolved;
          setPin(resolved);
        }
      }
      try {
        await saveAddress.mutateAsync({
          id: editing?.id,
          input: {
            label: values.label,
            full_name: values.fullName,
            phone: values.phone,
            address: values.address,
            lat: nextPin?.lat ?? null,
            lng: nextPin?.lng ?? null,
          },
          isDefault: makeDefault,
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showToast(editing ? t("addresses.toastUpdated") : t("addresses.toastAdded"));
        setSheetVisible(false);
      } catch {
        showToast(t("addresses.toastSaveFailed"));
      }
    },
    [editing, makeDefault, saveAddress, showToast, pin, mapLink, t],
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
          paddingBottom: spacing.md,
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
          {t("addresses.title")}
        </Text>
      </View>

      {isLoading ? null : addresses.length === 0 ? (
        <EmptyState
          icon={<MapPin size={28} color={colors.espresso} strokeWidth={1.8} />}
          title={t("addresses.emptyTitle")}
          description={t("addresses.emptyDescription")}
          actionLabel={t("addresses.addAddress")}
          onAction={openAdd}
        />
      ) : (
        <FlatList showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false}
 data={addresses}
 keyExtractor={(a) => a.id}
 contentContainerStyle={{ padding: spacing.xl }}
 renderItem={({ item }) => (
 <AddressCard address={item} onEdit={openEdit} />
          )}
        />
      )}

      {addresses.length > 0 && (
        <View
          style={{
            padding: spacing.xl,
            borderTopWidth: 1,
            borderTopColor: colors.line,
            backgroundColor: colors.surface,
          }}
        >
          <Button label={t("addresses.addAddress")} onPress={openAdd} variant="primary" />
        </View>
      )}

      <BottomSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
      >
        <View style={{ paddingHorizontal: spacing.xl }}>
          <Text
            style={{
              color: colors.ink,
              fontSize: typography.body,
              fontWeight: "800",
              marginBottom: spacing.md,
            }}
          >
            {editing ? t("addresses.editAddress") : t("addresses.newAddress")}
          </Text>
          <FormProvider {...form}>
            <AddressFormFields />
          </FormProvider>
          <FieldInput
            label={t("store.pasteMapsLink")}
            value={mapLink}
            onChangeText={setMapLink}
            placeholder={t("store.pasteMapsLink")}
            autoCapitalize="none"
            autoCorrect={false}
            multiline
            inputStyle={{ minHeight: 48, textAlignVertical: "top", paddingTop: 12 }}
            containerStyle={{ marginTop: 12 }}
          />
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.sm }}>
            <Chip label={t("seller.findCoordinates")} active={false} onPress={readMapLink} />
            <Chip label={t("seller.useMyLocation")} active={false} onPress={useCurrentLocation} />
          </View>
          <Text style={{ color: linkError ? colors.danger : pin ? colors.green : colors.muted, fontSize: typography.micro, marginTop: spacing.xs, marginBottom: spacing.sm }}>
            {linkError ? linkError : pin ? t("store.pinSaved", { source: pinSource ? ` (${pinSource})` : "", lat: pin.lat.toFixed(5), lng: pin.lng.toFixed(5) }) : t("addresses.mapHint")}
          </Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginVertical: spacing.md,
            }}
          >
            <Text
              style={{
                color: colors.ink,
                fontSize: typography.bodySmall,
                fontWeight: "600",
              }}
              >
                {t("addresses.useAsDefault")}
              </Text>
            <Switch
              value={makeDefault}
              onValueChange={setMakeDefault}
              trackColor={{ true: colors.green, false: colors.line }}
            />
          </View>

          <Button
            label={editing ? t("addresses.saveChanges") : t("addresses.addAddress")}
            onPress={form.handleSubmit(onSubmit)}
            loading={saveAddress.isPending}
            variant="primary"
          />
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
}
