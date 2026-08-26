// src/app/sign-in.tsx
import { Button } from "@/components/ui/Button";
import { FormScrollView } from "@/components/ui/FormScrollView";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { supabase } from "@/services/supabase";
import { useTheme } from "@/theme";
import { Stagger } from "@animatereactnative/stagger";
import { zodResolver } from "@hookform/resolvers/zod";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useCallback, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Pressable, StyleSheet, Text, TextInput } from "react-native";
import { Easing, FadeInUp } from "react-native-reanimated";
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
            <PasswordInput
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="Password"
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
          label="Sign in"
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
            Forgot password?
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
            Don&apos;t have an account?{" "}
            <Text style={{ color: colors.espresso, fontWeight: "800" }}>
              Sign up
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
