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
  TextInput,
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
  const { colors, radius } = useTheme();
  const { t } = useTranslation();
  const {
    control,
    formState: { errors },
  } = useFormContext<AddressForm>();

  const fields = [
    { name: "label" as const, placeholder: t("addresses.labelPlaceholder") },
    { name: "fullName" as const, placeholder: t("addresses.recipientPlaceholder") },
    { name: "phone" as const, placeholder: t("addresses.phonePlaceholder") },
  ];

  return (
    <>
      {fields.map((f) => (
        <View key={f.name} style={{ marginBottom: 12 }}>
          <Controller
            control={control}
            name={f.name}
            render={({ field: { value, onChange } }) => (
              <TextInput
                value={value}
                onChangeText={onChange}
                placeholder={f.placeholder}
                placeholderTextColor={colors.muted}
                style={{
                  borderWidth: 1,
                  borderColor: errors[f.name] ? colors.danger : colors.line,
                  height: 48,
                  paddingHorizontal: 14,
                  fontSize: 14,
                  color: colors.ink,
                  borderRadius: radius.md,
                }}
              />
            )}
          />
          {errors[f.name] && (
            <Text style={{ color: colors.danger, fontSize: 11, marginTop: 4 }}>
              {t(errors[f.name]?.message ?? "")}
            </Text>
          )}
        </View>
      ))}
      <Controller
        control={control}
        name="address"
        render={({ field: { value, onChange } }) => (
          <TextInput
            value={value}
            onChangeText={onChange}
            placeholder={t("addresses.addressPlaceholder")}
            placeholderTextColor={colors.muted}
            multiline
            style={{
              borderWidth: 1,
              borderColor: errors.address ? colors.danger : colors.line,
              minHeight: 80,
              padding: 14,
              fontSize: 14,
              color: colors.ink,
              borderRadius: radius.md,
              textAlignVertical: "top",
            }}
          />
        )}
      />
      {errors.address && (
        <Text style={{ color: colors.danger, fontSize: 11, marginTop: 4 }}>
          {t(errors.address.message ?? "")}
        </Text>
      )}
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

  const form = useForm<AddressForm>({
    resolver: zodResolver(addressSchema),
    defaultValues: { label: "", fullName: "", phone: "", address: "" },
  });
  const [makeDefault, setMakeDefault] = useState(false);

  const openAdd = useCallback(() => {
    setEditing(null);
    setMakeDefault((addresses?.length ?? 0) === 0);
    form.reset({ label: "", fullName: "", phone: "", address: "" });
    setSheetVisible(true);
  }, [addresses, form]);

  const openEdit = useCallback(
    (a: Address) => {
      setEditing(a);
      setMakeDefault(!!a.is_default);
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
      try {
        await saveAddress.mutateAsync({
          id: editing?.id,
          input: {
            label: values.label,
            full_name: values.fullName,
            phone: values.phone,
            address: values.address,
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
    [editing, makeDefault, saveAddress, showToast],
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
        <FlatList
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
