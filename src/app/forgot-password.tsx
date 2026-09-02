// src/app/forgot-password.tsx
import { Button } from "@/components/ui/Button";
import { FieldInput } from "@/components/ui/FieldInput";
import { IconButton } from "@/components/ui/IconButton";
import { supabase } from "@/services/supabase";
import { useToastStore } from "@/stores/toastStore";
import { useTheme } from "@/theme";
import { Stagger } from "@animatereactnative/stagger";
import { zodResolver } from "@hookform/resolvers/zod";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useCallback, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";
import {
  Easing,
  FadeInUp,
  FadeOutDown,
  ZoomInEasyDown,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { z } from "zod";

export default function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const { colors, spacing, typography } = useTheme();
  const router = useRouter();
  const showToast = useToastStore((s) => s.show);
  const [sent, setSent] = useState(false);
  const schema = z.object({ email: z.string().email(t("auth.emailInvalid")) });
  type FormValues = z.infer<typeof schema>;
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  const onSubmit = useCallback(
    async ({ email }: FormValues) => {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: Linking.createURL("reset-password"),
      });
      // A failed request must not look like success, surface it and stay on
      // the form so the user can retry.
      if (error) {
        showToast(t("auth.resetEmailFailed"));
        return;
      }
      setSent(true);
    },
    [showToast, t],
  );

  if (sent) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.bg,
          alignItems: "center",
          justifyContent: "center",
          padding: spacing.xl,
        }}
      >
        <Stagger
          stagger={70}
          duration={420}
          entering={() => ZoomInEasyDown.springify()}
          exiting={() => FadeOutDown.springify()}
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
            {t("auth.resetEmailSent")}
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
        }}
      >
        <IconButton
          accessibilityLabel={t("auth.goBack")}
          onPress={() => router.back()}
        >
          <ChevronLeft size={20} color={colors.ink} strokeWidth={2} />
        </IconButton>
      </View>
      <Stagger
        stagger={70}
        duration={420}
        entering={() => FadeInUp.duration(420).easing(Easing.out(Easing.cubic))}
        style={{
          flex: 1,
          paddingHorizontal: spacing.xl,
          justifyContent: "center",
          gap: spacing.md,
        }}
      >
        <View>
          <Text
            style={{
              color: colors.ink,
              fontSize: typography.title,
              fontWeight: "800",
              marginBottom: spacing.sm,
            }}
          >
            {t("auth.resetPassword")}
          </Text>
          <Text
            style={{
              color: colors.muted,
              fontSize: typography.bodySmall,
              marginBottom: spacing.xl,
            }}
          >
            {t("auth.resetInstruction")}
          </Text>
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
              />
            )}
          />
        </View>
        <Button
          label={t("auth.sendResetLink")}
          onPress={handleSubmit(onSubmit)}
          loading={isSubmitting}
          variant="primary"
        />
      </Stagger>
    </SafeAreaView>
  );
}
