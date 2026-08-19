// src/app/sign-up.tsx
import { Button } from "@/components/ui/Button";
import { supabase } from "@/services/supabase";
import { useTheme } from "@/theme";
import { Stagger } from "@animatereactnative/stagger";
import { zodResolver } from "@hookform/resolvers/zod";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { Easing, FadeInUp } from "react-native-reanimated";
import { z } from "zod";

const schema = z
  .object({
    fullName: z.string().min(1, "Enter your name"),
    email: z.string().email("Enter a valid email"),
    password: z.string().min(6, "At least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });
type FormValues = z.infer<typeof schema>;

export default function SignUpScreen() {
  const { colors, spacing, radius, typography } = useTheme();
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
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
            ? "An account with this email already exists."
            : "Could not create your account. Please try again.",
        );
        return;
      }

      if (!data.session) setNeedsConfirmation(true);
    },
    [],
  );

  if (needsConfirmation) {
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
            Check your email
          </Text>
          <Text
            style={{
              color: colors.muted,
              fontSize: typography.bodySmall,
              textAlign: "center",
              marginBottom: spacing.xl,
            }}
          >
            Confirm your address to finish creating your account.
          </Text>
          <Button
            label="Back to sign in"
            onPress={() => router.replace("/sign-in")}
            variant="soft"
          />
        </Stagger>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Stagger
        stagger={70}
        duration={420}
        entering={() => FadeInUp.duration(420).easing(Easing.out(Easing.cubic))}
        style={{
          flex: 1,
          paddingHorizontal: spacing.xl,
          justifyContent: "center",
        }}
      >
        <Text
          style={{
            color: colors.ink,
            fontSize: typography.title,
            fontWeight: "800",
            marginBottom: spacing.xxl,
          }}
        >
          Create your account
        </Text>

        <View>
          <Controller
            control={control}
            name="fullName"
            render={({ field: { value, onChange, onBlur } }) => (
              <TextInput
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="Full name"
                placeholderTextColor={colors.muted}
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
          {errors.fullName && (
            <Text
              style={{
                color: colors.danger,
                fontSize: 11,
                marginBottom: spacing.sm,
              }}
            >
              {errors.fullName.message}
            </Text>
          )}
        </View>

        <View>
          <Controller
            control={control}
            name="email"
            render={({ field: { value, onChange, onBlur } }) => (
              <TextInput
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="Email"
                placeholderTextColor={colors.muted}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
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
          {errors.email && (
            <Text
              style={{
                color: colors.danger,
                fontSize: 11,
                marginBottom: spacing.sm,
              }}
            >
              {errors.email.message}
            </Text>
          )}
        </View>

        <View>
          <Controller
            control={control}
            name="password"
            render={({ field: { value, onChange, onBlur } }) => (
              <TextInput
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="Password"
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
              <TextInput
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="Confirm password"
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
        </View>

        <Button
          label="Create account"
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
            Already have an account? Sign in
          </Text>
        </Pressable>
      </Stagger>
    </KeyboardAvoidingView>
  );
}
