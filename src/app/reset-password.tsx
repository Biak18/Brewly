// src/app/reset-password.tsx
import { Button } from "@/components/ui/Button";
import { FormScrollView } from "@/components/ui/FormScrollView";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { PasswordRequirements } from "@/components/ui/PasswordRequirements";
import { useTranslation } from "react-i18next";
import { supabase } from "@/services/supabase";
import { useAuthStore } from "@/stores/authStore";
import { useTheme } from "@/theme";
import { Stagger } from "@animatereactnative/stagger";
import { zodResolver } from "@hookform/resolvers/zod";
import * as Haptics from "expo-haptics";
import { useCallback, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { Text, View } from "react-native";
import { FadeOutDown, ZoomInEasyDown } from "react-native-reanimated";
import { z } from "zod";

export default function ResetPasswordScreen() {
  const { t } = useTranslation();
  const { colors, spacing, typography } = useTheme();
  const [serverError, setServerError] = useState<string | null>(null);
  const schema = z
    .object({
      password: z
        .string()
        .min(6, t("auth.passwordMinLength"))
        .refine((v) => /[A-Z]/.test(v), {
          message: t("auth.passwordReqUpper"),
        })
        .refine((v) => /[^A-Za-z0-9]/.test(v), {
          message: t("auth.passwordReqSpecial"),
        }),
      confirmPassword: z.string(),
    })
    .refine((d) => d.password === d.confirmPassword, {
      message: t("auth.passwordsDontMatch"),
      path: ["confirmPassword"],
    });
  type FormValues = z.infer<typeof schema>;
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirmPassword: "" },
  });
  const watchedPassword = useWatch({ control, name: "password" }) ?? "";

  const onSubmit = useCallback(async ({ password }: FormValues) => {
    setServerError(null);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setServerError(t("auth.passwordUpdateFailed"));
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // The recovery session IS a valid session the moment this succeeds вЂ”
    // clearing the flag hands control back to the normal session guard,
    // which drops them straight into the app. No second sign-in needed.
    useAuthStore.setState({ isPasswordRecovery: false });
  }, [t]);

  return (
    <FormScrollView
      style={{
        flex: 1,
        paddingTop: spacing.sm,
        backgroundColor: colors.bg,
      }}
      contentContainerStyle={{
        flexGrow: 1,
        paddingHorizontal: spacing.xl,
        justifyContent: "center",
      }}
    >
      <Stagger
        stagger={70}
        duration={420}
        entering={() => ZoomInEasyDown.springify()}
        exiting={() => FadeOutDown.springify()}
      >
        <Text
          style={{
            color: colors.ink,
            fontSize: typography.title,
            fontWeight: "800",
            marginBottom: spacing.xl,
          }}
        >
          {t("auth.setNewPassword")}
        </Text>
        <View>
          <Controller
            control={control}
            name="password"
            render={({ field: { value, onChange, onBlur } }) => (
              <PasswordInput
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder={t("auth.newPasswordPlaceholder")}
                containerStyle={{
                  marginTop: spacing.sm,
                  marginBottom: spacing.xs,
                }}
              />
            )}
          />
          <PasswordRequirements password={watchedPassword} />
          {errors.password && (
            <Text
              style={{
                color: colors.danger,
                fontSize: 11,
                marginTop: spacing.xs,
                marginBottom: spacing.sm,
              }}
            >
              {errors.password.message}
            </Text>
          )}
        </View>
        <View>
          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { value, onChange, onBlur } }) => (
              <PasswordInput
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder={t("auth.confirmNewPasswordPlaceholder")}
                containerStyle={{
                  marginTop: spacing.sm,
                  marginBottom: spacing.sm,
                }}
              />
            )}
          />
          {errors.confirmPassword && (
            <Text
              style={{
                color: colors.danger,
                fontSize: 11,
                marginBottom: spacing.sm,
              }}
            >
              {errors.confirmPassword.message}
            </Text>
          )}
          {serverError && (
            <Text
              style={{
                color: colors.danger,
                fontSize: 11,
                marginBottom: spacing.sm,
              }}
            >
              {serverError}
            </Text>
          )}
        </View>
        <Button
          label={t("auth.updatePassword")}
          onPress={handleSubmit(onSubmit)}
          loading={isSubmitting}
          variant="primary"
        />
      </Stagger>
    </FormScrollView>
  );
}