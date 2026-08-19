// src/app/forgot-password.tsx
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { Stagger } from "@/components/ui/Stagger";
import { supabase } from "@/services/supabase";
import { useTheme } from "@/theme";
import { zodResolver } from "@hookform/resolvers/zod";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useCallback, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { z } from "zod";

const schema = z.object({ email: z.string().email("Enter a valid email") });
type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordScreen() {
  const { colors, spacing, radius, typography } = useTheme();
  const router = useRouter();
  const [sent, setSent] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  const onSubmit = useCallback(async ({ email }: FormValues) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: Linking.createURL("reset-password"),
    });
    if (error) console.warn("resetPasswordForEmail error", error.message);

    setSent(true);
  }, []);

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
        <Stagger index={0}>
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
        </Stagger>
        <Stagger index={1}>
          <Text
            style={{
              color: colors.muted,
              fontSize: typography.bodySmall,
              textAlign: "center",
              marginBottom: spacing.xl,
            }}
          >
            If an account exists for that address, we've sent a link to reset
            your password.
          </Text>
        </Stagger>
        <Stagger index={2}>
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
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: spacing.lg,
        }}
      >
        <IconButton accessibilityLabel="Go back" onPress={() => router.back()}>
          <ChevronLeft size={20} color={colors.ink} strokeWidth={2} />
        </IconButton>
      </View>
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
              marginBottom: spacing.sm,
            }}
          >
            Reset password
          </Text>
          <Text
            style={{
              color: colors.muted,
              fontSize: typography.bodySmall,
              marginBottom: spacing.xl,
            }}
          >
            Enter your email and we'll send you a reset link.
          </Text>
        </Stagger>
        <Stagger index={1}>
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
        </Stagger>
        <Stagger index={2}>
          <Button
            label="Send reset link"
            onPress={handleSubmit(onSubmit)}
            loading={isSubmitting}
            variant="primary"
          />
        </Stagger>
      </View>
    </SafeAreaView>
  );
}
