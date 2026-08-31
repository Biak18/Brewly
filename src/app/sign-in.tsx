// src/app/sign-in.tsx
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
import { router } from "expo-router";
import { useCallback, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Pressable, StyleSheet, Text } from "react-native";
import { Easing, FadeInUp } from "react-native-reanimated";
import { z } from "zod";

export default function SignInScreen() {
  const { t } = useTranslation();
  const { colors, spacing, typography } = useTheme();
  const [serverError, setServerError] = useState<string | null>(null);
  const signInSchema = z.object({
    email: z.string().email(t("auth.emailInvalid")),
    password: z.string().min(6, t("auth.passwordMinLength")),
  });
  type SignInForm = z.infer<typeof signInSchema>;
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInForm>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = useCallback(async (values: SignInForm) => {
    setServerError(null);
    const { error } = await supabase.auth.signInWithPassword(values);
    if (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setServerError(t("auth.incorrectCredentials"));
    }
    // No manual navigation here: authStore's listener updates session state,
    // Stack.Protected reacts to it, root layout swaps to (tabs) on its own.
  }, [t]);

  return (
    <FormScrollView
      style={[
        styles.flex,
        { paddingTop: spacing.sm, backgroundColor: colors.bg },
      ]}
      contentContainerStyle={styles.container}
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
          {t("auth.appName")}
        </Text>

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
              containerStyle={{ marginBottom: spacing.sm }}
            />
          )}
        />

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
          <Text style={[styles.error, { color: colors.danger }]}>
            {errors.password.message}
          </Text>
        )}
        {serverError && (
          <Text
            style={[
              styles.error,
              { color: colors.danger, marginBottom: spacing.sm },
            ]}
          >
            {serverError}
          </Text>
        )}

        <Button
          label={t("auth.signIn")}
          onPress={handleSubmit(onSubmit)}
          loading={isSubmitting}
          variant="primary"
        />

        <Pressable
          onPress={() => router.push("/forgot-password")}
          style={{ marginTop: spacing.md, alignSelf: "center" }}
        >
          <Text
            style={{
              color: colors.muted,
              fontSize: typography.caption,
              fontWeight: "600",
            }}
          >
            {t("auth.forgotPassword")}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => router.push("/sign-up")}
          style={{ marginTop: spacing.sm, alignSelf: "center" }}
        >
          <Text
            style={{
              color: colors.muted,
              fontSize: typography.caption,
              fontWeight: "600",
            }}
          >
            {t("auth.noAccount")}{" "}
            <Text style={{ color: colors.espresso, fontWeight: "800" }}>
              {t("auth.signUp")}
            </Text>
          </Text>
        </Pressable>
      </Stagger>
    </FormScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 20 },
  input: { borderWidth: 1, height: 48, paddingHorizontal: 14, fontSize: 14 },
  error: { fontSize: 11, marginBottom: 4 },
});