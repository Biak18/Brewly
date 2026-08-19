// src/app/reset-password.tsx
import { Button } from "@/components/ui/Button";
import { Stagger } from "@/components/ui/Stagger";
import { supabase } from "@/services/supabase";
import { useAuthStore } from "@/stores/authStore";
import { useTheme } from "@/theme";
import { zodResolver } from "@hookform/resolvers/zod";
import * as Haptics from "expo-haptics";
import { useCallback, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  View,
} from "react-native";
import { z } from "zod";

const schema = z
  .object({
    password: z.string().min(6, "At least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });
type FormValues = z.infer<typeof schema>;

export default function ResetPasswordScreen() {
  const { colors, spacing, radius, typography } = useTheme();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const onSubmit = useCallback(async ({ password }: FormValues) => {
    setServerError(null);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setServerError(
        "Could not update your password. Try requesting a new link.",
      );
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    useAuthStore.setState({ isPasswordRecovery: false });
  }, []);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View
        style={{
          flex: 1,
          paddingHorizontal: spacing.xl,
          justifyContent: "center",
        }}
      >
        <Stagger index={0}>
          <Text
            style={{
              color: colors.ink,
              fontSize: typography.title,
              fontWeight: "800",
              marginBottom: spacing.xl,
            }}
          >
            Set a new password
          </Text>
        </Stagger>
        <Stagger index={1}>
          <Controller
            control={control}
            name="password"
            render={({ field: { value, onChange, onBlur } }) => (
              <TextInput
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="New password"
                placeholderTextColor={colors.muted}
                secureTextEntry
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
        </Stagger>
        <Stagger index={2}>
          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { value, onChange, onBlur } }) => (
              <TextInput
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="Confirm new password"
                placeholderTextColor={colors.muted}
                secureTextEntry
                style={{
                  borderWidth: 1,
                  borderColor: colors.line,
                  height: 48,
                  paddingHorizontal: 14,
                  fontSize: 14,
                  color: colors.ink,
                  borderRadius: radius.md,
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
        </Stagger>
        <Stagger index={3}>
          <Button
            label="Update password"
            onPress={handleSubmit(onSubmit)}
            loading={isSubmitting}
            variant="primary"
          />
        </Stagger>
      </View>
    </KeyboardAvoidingView>
  );
}
