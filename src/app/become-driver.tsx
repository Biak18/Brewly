// src/app/become-driver.tsx
import { Button } from "@/components/ui/Button";
import { FormScrollView } from "@/components/ui/FormScrollView";
import { IconButton } from "@/components/ui/IconButton";
import { registerAsDriver } from "@/services/orders";
import { refreshProfile } from "@/stores/authStore";
import { useToastStore } from "@/stores/toastStore";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/theme";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useCallback, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { z } from "zod";

export default function BecomeDriverScreen() {
  const { colors, spacing, radius, typography } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const showToast = useToastStore((s) => s.show);
  const [serverError, setServerError] = useState<string | null>(null);

  const schema = z.object({
    fullName: z.string().trim().min(2, t("driver.nameRequired")),
    phone: z
      .string()
      .trim()
      .regex(/^[0-9+\s-]{6,15}$/, t("driver.phoneInvalid")),
    vehicle: z.string().trim().min(2, t("driver.vehicleRequired")),
  });
  type FormValues = z.infer<typeof schema>;

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { fullName: "", phone: "", vehicle: "" },
  });

  const onSubmit = useCallback(
    async (values: FormValues) => {
      setServerError(null);
      try {
        await registerAsDriver({
          fullName: values.fullName,
          phone: values.phone,
          vehicle: values.vehicle,
        });
        await refreshProfile();
        showToast(t("driver.registered"));
        router.replace("/(driver)" as any);
      } catch {
        setServerError(t("driver.registerFailed"));
      }
    },
    [showToast, t, router],
  );

  const inputStyle = {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    color: colors.ink,
    paddingHorizontal: spacing.md,
    height: 46,
    fontSize: typography.bodySmall,
  } as const;

  const fields = [
    { name: "fullName" as const, label: t("driver.name"), placeholder: t("driver.name") },
    {
      name: "phone" as const,
      label: t("driver.phone"),
      placeholder: t("driver.phone"),
      keyboardType: "phone-pad" as const,
    },
    { name: "vehicle" as const, label: t("driver.vehicle"), placeholder: t("driver.vehicle") },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
        }}
      >
        <IconButton accessibilityLabel={t("common.back")} onPress={() => router.back()}>
          <ChevronLeft size={20} color={colors.ink} strokeWidth={2} />
        </IconButton>
        <Text
          style={{
            marginLeft: spacing.sm,
            color: colors.ink,
            fontSize: typography.body,
            fontWeight: "800",
          }}
        >
          {t("driver.becomeDriver")}
        </Text>
      </View>
      <FormScrollView
        contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg }}
      >
        <Text style={{ color: colors.muted, fontSize: typography.bodySmall }}>
          {t("driver.becomeDriverDesc")}
        </Text>
        {fields.map((field) => (
          <View key={field.name} style={{ gap: spacing.xs }}>
            <Text style={{ color: colors.muted, fontSize: typography.caption }}>
              {field.label}
            </Text>
            <Controller
              control={control}
              name={field.name}
              render={({ field: { value, onChange, onBlur } }) => (
                <TextInput
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder={field.placeholder}
                  placeholderTextColor={colors.muted}
                  keyboardType={field.keyboardType ?? "default"}
                  style={[
                    inputStyle,
                    errors[field.name] ? { borderColor: colors.danger } : null,
                  ]}
                />
              )}
            />
            {errors[field.name] && (
              <Text style={{ color: colors.danger, fontSize: typography.caption }}>
                {errors[field.name]?.message}
              </Text>
            )}
          </View>
        ))}
        {serverError && (
          <Text style={{ color: colors.danger, fontSize: typography.caption }}>
            {serverError}
          </Text>
        )}
        <Button
          label={t("driver.register")}
          onPress={handleSubmit(onSubmit)}
          loading={isSubmitting}
          variant="primary"
        />
      </FormScrollView>
    </SafeAreaView>
  );
}
