// src/app/my-store/edit.tsx
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { fetchMyStore, updateMyStore } from "@/services/stores";
import { useAuthStore } from "@/stores/authStore";
import { useToastStore } from "@/stores/toastStore";
import { useTheme } from "@/theme";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { Controller, useForm } from "react-hook-form";
import { ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect } from "react";
import { z } from "zod";

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

const schema = z.object({
  name: z.string().min(1, "Enter your shop name"),
  address: z.string().min(1, "Enter your shop address"),
  openTime: z
    .string()
    .refine((v) => v === "" || TIME_REGEX.test(v), "Use HH:MM"),
  closeTime: z
    .string()
    .refine((v) => v === "" || TIME_REGEX.test(v), "Use HH:MM"),
  kpayPhone: z.string(),
  paymentNote: z.string(),
});
type FormValues = z.infer<typeof schema>;

export default function EditStoreScreen() {
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
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      address: "",
      openTime: "",
      closeTime: "",
      kpayPhone: "",
      paymentNote: "",
    },
  });

  useEffect(() => {
    if (store) {
      reset({
        name: store.name ?? "",
        address: store.address ?? "",
        openTime: store.hours?.open ?? "",
        closeTime: store.hours?.close ?? "",
        kpayPhone: store.kpay_phone ?? "",
        paymentNote: store.payment_note ?? "",
      });
    }
  }, [store, reset]);

  const save = useMutation({
    mutationFn: (values: FormValues) => {
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

  if (!store) return null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: spacing.lg,
          paddingBottom: spacing.lg,
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
          Store settings
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.xl }}>
        <Text
          style={{
            color: colors.muted,
            fontSize: typography.bodySmall,
            marginBottom: spacing.xl,
          }}
        >
          Update your shop details and the KPay number customers pay to.
        </Text>

        {(
          [
            { name: "name", placeholder: "Shop name", err: errors.name },
            {
              name: "address",
              placeholder: "Address",
              err: errors.address,
            },
          ] as const
        ).map((f) => (
          <View key={f.name} style={{ marginBottom: spacing.sm }}>
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
                    borderColor: f.err ? colors.danger : colors.line,
                    height: 48,
                    paddingHorizontal: 14,
                    fontSize: 14,
                    color: colors.ink,
                    borderRadius: radius.md,
                  }}
                />
              )}
            />
            {!!f.err && (
              <Text
                style={{ color: colors.danger, fontSize: 11, marginTop: 4 }}
              >
                {f.err.message}
              </Text>
            )}
          </View>
        ))}

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
        >
          Opening hours
        </Text>
        <View style={{ flexDirection: "row", gap: spacing.sm }}>
          {(
            [
              {
                name: "openTime",
                placeholder: "Opens (07:00)",
                err: errors.openTime,
              },
              {
                name: "closeTime",
                placeholder: "Closes (19:00)",
                err: errors.closeTime,
              },
            ] as const
          ).map((f) => (
            <View key={f.name} style={{ flex: 1 }}>
              <Controller
                control={control}
                name={f.name}
                render={({ field: { value, onChange } }) => (
                  <TextInput
                    value={value}
                    onChangeText={onChange}
                    placeholder={f.placeholder}
                    placeholderTextColor={colors.muted}
                    keyboardType="numbers-and-punctuation"
                    style={{
                      borderWidth: 1,
                      borderColor: f.err ? colors.danger : colors.line,
                      height: 48,
                      paddingHorizontal: 14,
                      fontSize: 14,
                      color: colors.ink,
                      borderRadius: radius.md,
                    }}
                  />
                )}
              />
              {!!f.err && (
                <Text
                  style={{ color: colors.danger, fontSize: 11, marginTop: 4 }}
                >
                  {f.err.message}
                </Text>
              )}
            </View>
          ))}
        </View>
        <Text
          style={{
            color: colors.muted,
            fontSize: typography.micro,
            marginTop: spacing.xs,
          }}
        >
          Leave both empty if you don't want to show hours.
        </Text>

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
              placeholder="Note shown to customers (account name, MMQR hint…)"
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
              }}
            />
          )}
        />

        <View style={{ marginVertical: spacing.xxl }}>
          <Button
            label="Save changes"
            onPress={handleSubmit((v) => save.mutateAsync(v))}
            loading={isSubmitting || save.isPending}
            variant="primary"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
