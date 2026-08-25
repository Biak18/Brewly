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

const addressSchema = z.object({
  label: z.string().trim().min(1, "Add a label"),
  fullName: z.string().trim().min(1, "Enter the recipient name"),
  phone: z.string().trim().min(5, "Enter a contact phone"),
  address: z.string().trim().min(6, "Enter the street address"),
});
type AddressForm = z.infer<typeof addressSchema>;

function AddressFormFields() {
  const { colors, radius } = useTheme();
  const {
    control,
    formState: { errors },
  } = useFormContext<AddressForm>();

  const fields = [
    { name: "label" as const, placeholder: "Label (Home, Work…)" },
    { name: "fullName" as const, placeholder: "Recipient name" },
    { name: "phone" as const, placeholder: "Phone (09XXXXXXXXX)" },
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
              {errors[f.name]?.message}
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
            placeholder="Street address, township, landmark…"
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
          {errors.address.message}
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
                Default
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
              Set as default
            </Text>
          </Pressable>
        )}
      </View>
      <View style={{ flexDirection: "row", gap: 2 }}>
        <IconButton
          accessibilityLabel={`Edit ${address.label}`}
          onPress={() => onEdit(address)}
        >
          <Pencil size={16} color={colors.muted} strokeWidth={1.8} />
        </IconButton>
        <IconButton
          accessibilityLabel={`Delete ${address.label}`}
          onPress={() =>
            showConfirm({
              title: `Delete "${address.label}"?`,
              message: "This address will be removed from your address book.",
              confirmLabel: "Delete",
              destructive: true,
              onConfirm: async () => {
                try {
                  await deleteAddress.mutateAsync(address.id);
                  showToast("Address deleted");
                } catch {
                  showToast("Could not delete this address");
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
        showToast(editing ? "Address updated" : "Address added");
        setSheetVisible(false);
      } catch {
        showToast("Could not save this address");
      }
    },
    [editing, makeDefault, saveAddress, showToast],
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: spacing.lg,
          paddingBottom: spacing.md,
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
          Delivery addresses
        </Text>
      </View>

      {isLoading ? null : addresses.length === 0 ? (
        <EmptyState
          icon={<MapPin size={28} color={colors.espresso} strokeWidth={1.8} />}
          title="No addresses yet"
          description="Add an address to get your orders delivered."
          actionLabel="Add address"
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
          <Button label="Add address" onPress={openAdd} variant="primary" />
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
            {editing ? "Edit address" : "New address"}
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
              Use as default
            </Text>
            <Switch
              value={makeDefault}
              onValueChange={setMakeDefault}
              trackColor={{ true: colors.green, false: colors.line }}
            />
          </View>

          <Button
            label={editing ? "Save changes" : "Add address"}
            onPress={form.handleSubmit(onSubmit)}
            loading={saveAddress.isPending}
            variant="primary"
          />
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
}
