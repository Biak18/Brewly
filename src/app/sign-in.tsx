// src/app/sign-in.tsx
import { Button } from "@/components/ui/Button";
import { supabase } from "@/services/supabase";
import { useTheme } from "@/theme";
import { zodResolver } from "@hookform/resolvers/zod";
import * as Haptics from "expo-haptics";
import { useCallback, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { z } from "zod";

const signInSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "At least 6 characters"),
});
type SignInForm = z.infer<typeof signInSchema>;

export default function SignInScreen() {
  const { colors, spacing, radius, typography } = useTheme();
  const [serverError, setServerError] = useState<string | null>(null);
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
      setServerError("Incorrect email or password.");
    }
    // No manual navigation here: authStore's listener updates session state,
    // Stack.Protected reacts to it, root layout swaps to (tabs) on its own.
  }, []);

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.bg }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.container, { paddingHorizontal: spacing.xl }]}>
        <Text
          style={{
            color: colors.ink,
            fontSize: typography.title,
            fontWeight: "800",
            marginBottom: spacing.xxl,
          }}
        >
          Brewly
        </Text>

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
              style={[
                styles.input,
                {
                  borderColor: colors.line,
                  color: colors.ink,
                  borderRadius: radius.md,
                  marginBottom: spacing.sm,
                },
              ]}
            />
          )}
        />
        {errors.email && (
          <Text style={[styles.error, { color: colors.danger }]}>
            {errors.email.message}
          </Text>
        )}

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
              autoComplete="password"
              style={[
                styles.input,
                {
                  borderColor: colors.line,
                  color: colors.ink,
                  borderRadius: radius.md,
                  marginTop: spacing.sm,
                  marginBottom: spacing.sm,
                },
              ]}
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
          label="Sign in"
          onPress={handleSubmit(onSubmit)}
          loading={isSubmitting}
          variant="primary"
        />

        <Text
          style={{
            color: colors.muted,
            fontSize: typography.caption,
            marginTop: spacing.xl,
            textAlign: "center",
          }}
        >
          No account? Ask the shop owner to invite you — there's no self
          sign-up.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, justifyContent: "center" },
  input: { borderWidth: 1, height: 48, paddingHorizontal: 14, fontSize: 14 },
  error: { fontSize: 11, marginBottom: 4 },
});
