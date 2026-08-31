// src/app/sign-up.tsx
import { Button } from "@/components/ui/Button";
import { FieldInput } from "@/components/ui/FieldInput";
import { FormScrollView } from "@/components/ui/FormScrollView";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { useTranslation } from "react-i18next";
import { supabase } from "@/services/supabase";
import { useTheme } from "@/theme";
import { Stagger } from "@animatereactnative/stagger";
import { zodResolver } from "@hookform/resolvers/zod";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Pressable, Text, View } from "react-native";
import { Easing, FadeInUp } from "react-native-reanimated";
import { z } from "zod";

export default function SignUpScreen() {
  const { t } = useTranslation();
  const { colors, spacing, typography } = useTheme();
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const schema = z
    .object({
      fullName: z.string().min(1, t("auth.nameRequired")),
      email: z.string().email(t("auth.emailInvalid")),
      password: z.string().min(6, t("auth.passwordMinLength")),
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
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = useCallback(
    async ({ fullName, email, password }: FormValues) => {
      setServerError(null);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (error) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setServerError(
          error.message.toLowerCase().includes("already registered")
            ? t("auth.accountExists")
            : t("auth.accountCreateFailed"),
        );
        return;
      }

      if (!data.session) setNeedsConfirmation(true);
    },
    [t],
  );

  if (needsConfirmation) {
    return (
      <View
        style={{
          flex: 1,
          paddingTop: spacing.sm,
          backgroundColor: colors.bg,
          alignItems: "center",
          justifyContent: "center",
          padding: spacing.xl,
        }}
      >
        <Stagger
          stagger={70}
          duration={420}
          entering={() =>
            FadeInUp.duration(420).easing(Easing.out(Easing.cubic))
          }
          style={{ alignItems: "center" }}
        >
          <Text
            style={{
              color: colors.ink,
              fontSize: typography.subheading,
              fontWeight: "800",
              marginBottom: spacing.sm,
              textAlign: "center",
            }}
          >
            {t("auth.checkEmail")}
          </Text>
          <Text
            style={{
              color: colors.muted,
              fontSize: typography.bodySmall,
              textAlign: "center",
              marginBottom: spacing.xl,
            }}
          >
            {t("auth.confirmEmailInstruction")}
          </Text>
          <Button
            label={t("auth.backToSignIn")}
            onPress={() => router.replace("/sign-in")}
            variant="soft"
          />
        </Stagger>
      </View>
    );
  }

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
        entering={() => FadeInUp.duration(420).easing(Easing.out(Easing.cubic))}
      >
        <Text
          style={{
            color: colors.ink,
            fontSize: typography.title,
            fontWeight: "800",
            marginBottom: spacing.xxl,
          }}
        >
          {t("auth.createAccountTitle")}
        </Text>

        <View>
          <Controller
            control={control}
            name="fullName"
            render={({ field: { value, onChange, onBlur } }) => (
              <FieldInput
                label={t("auth.fullNamePlaceholder")}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder={t("auth.fullNamePlaceholder")}
                error={errors.fullName?.message}
                containerStyle={{ marginBottom: spacing.sm }}
              />
            )}
          />
        </View>

        <View>
          <Controller
            control={control}
            name="email"
            render={({ field: { value, onChange, onBlur } }) => (
              <FieldInput
                label={t("auth.emailPlaceholder")}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder={t("auth.emailPlaceholder")}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                error={errors.email?.message}
                containerStyle={{ marginTop: spacing.sm, marginBottom: spacing.sm }}
              />
            )}
          />
        </View>

        <View>
          <Controller
            control={control}
            name="password"
            render={({ field: { value, onChange, onBlur } }) => (
              <PasswordInput
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder={t("auth.passwordPlaceholder")}
                containerStyle={{
                  marginTop: spacing.sm,
                  marginBottom: spacing.sm,
                }}
              />
            )}
          />
          {errors.password && (
            <Text
              style={{
                color: colors.danger,
                fontSize: 11,
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
                placeholder={t("auth.confirmPasswordPlaceholder")}
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
          label={t("auth.createAccount")}
          onPress={handleSubmit(onSubmit)}
          loading={isSubmitting}
          variant="primary"
        />

        <Pressable
          onPress={() => router.replace("/sign-in")}
          style={{ marginTop: spacing.md, alignSelf: "center" }}
        >
          <Text
            style={{
              color: colors.muted,
              fontSize: typography.caption,
              fontWeight: "600",
            }}
          >
            {t("auth.alreadyHaveAccount")}
          </Text>
        </Pressable>
      </Stagger>
    </FormScrollView>
  );
}