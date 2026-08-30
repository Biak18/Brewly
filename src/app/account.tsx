// src/app/account.tsx
import { Button } from "@/components/ui/Button";
import { FormScrollView } from "@/components/ui/FormScrollView";
import { IconButton } from "@/components/ui/IconButton";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { useAvatarUpload } from "@/features/account/hooks/useAvatarUpload";
import {
  changePassword,
  deleteAccount,
  updateDisplayName,
} from "@/services/profile";
import { useAuthStore } from "@/stores/authStore";
import { useConfirmDialogStore } from "@/stores/confirmDialogStore";
import { useToastStore } from "@/stores/toastStore";
import { useTheme } from "@/theme";
import { zodResolver } from "@hookform/resolvers/zod";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { ChevronLeft, Pencil, UserRound } from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { z } from "zod";
import { useTranslation } from "react-i18next";

const nameSchema = z.object({
  fullName: z.string().trim().min(1, "account.nameRequired").max(60),
});
type NameForm = z.infer<typeof nameSchema>;

// Evaluated once per session so avatar cache-busting stays stable across
// re-renders without impure render-time Date.now() calls.
const AVATAR_EPOCH = Date.now();

const passwordSchema = z
  .object({
    password: z.string().min(8, "account.passwordMin"),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    path: ["confirm"],
    message: "account.passwordsMismatch",
  });
type PasswordForm = z.infer<typeof passwordSchema>;

export default function AccountScreen() {
  const { colors, spacing, radius, typography } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const session = useAuthStore((s) => s.session);
  const userId = session?.user.id;
  const showToast = useToastStore((s) => s.show);
  const showConfirm = useConfirmDialogStore((s) => s.show);
  const { pickAndUpload, isUploading } = useAvatarUpload(userId);

  const [isSavingName, setIsSavingName] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [avatarCacheKey, setAvatarCacheKey] = useState(0);

  const nameForm = useForm<NameForm>({
    resolver: zodResolver(nameSchema),
    defaultValues: { fullName: profile?.full_name ?? "" },
  });

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: "", confirm: "" },
  });

  const onSaveName = useCallback(
    async (values: NameForm) => {
      if (!userId) return;
      setIsSavingName(true);
      setNameError(null);
      try {
        await updateDisplayName(userId, values.fullName.trim());
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showToast(t("account.toastNameUpdated"));
      } catch {
        setNameError("account.nameUpdateFailed");
      } finally {
        setIsSavingName(false);
      }
    },
    [userId, showToast],
  );

  const onChangePassword = useCallback(
    async (values: PasswordForm) => {
      setIsSavingPassword(true);
      setPasswordError(null);
      try {
        await changePassword(values.password);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showToast(t("account.toastPasswordUpdated"));
        passwordForm.reset({ password: "", confirm: "" });
      } catch {
        setPasswordError("account.passwordChangeFailed");
      } finally {
        setIsSavingPassword(false);
      }
    },
    [showToast, passwordForm],
  );

  const onPickAvatar = useCallback(async () => {
    const url = await pickAndUpload();
    if (url) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast(t("account.toastPhotoUpdated"));
      setAvatarCacheKey(Date.now());
    }
  }, [pickAndUpload, showToast]);

  const onDeleteAccount = useCallback(() => {
    showConfirm({
      title: t("account.deleteTitle"),
      message: t("account.deleteMessage"),
      confirmLabel: t("account.deleteForever"),
      destructive: true,
      onConfirm: async () => {
        try {
          await deleteAccount();
          // Session is gone server-side; auth listener clears local state.
        } catch (err: any) {
          showToast(err?.message ?? t("account.deleteFailed"));
        }
      },
    });
  }, [showConfirm, showToast]);

  // Cache-bust after each upload so a refreshed avatar is never served
  // from the image cache under the same URL.
  const avatarUrl = useMemo(() => {
    if (!profile?.avatar_url) return null;
    const sep = profile.avatar_url.includes("?") ? "&" : "?";
    return `${profile.avatar_url}${sep}t=${AVATAR_EPOCH + avatarCacheKey}`;
  }, [profile?.avatar_url, avatarCacheKey]);

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
        <IconButton accessibilityLabel={t("common.back")} onPress={() => router.back()}>
          <ChevronLeft size={20} color={colors.ink} strokeWidth={2} />
        </IconButton>
        <Text
          style={{
            color: colors.ink,
            fontSize: typography.subheading,
            fontWeight: "800",
            marginLeft: spacing.md,
          }}
        >
          {t("account.title")}
        </Text>
      </View>

      <FormScrollView
        contentContainerStyle={{
          padding: spacing.xl,
          paddingBottom: spacing.xxxl,
        }}
      >
        {/* Avatar */}
        <View style={{ alignItems: "center", marginBottom: spacing.xxl }}>
          <Pressable
            onPress={onPickAvatar}
            disabled={isUploading}
            accessibilityLabel={t("account.changePhoto")}
            style={{
              width: 96,
              height: 96,
              borderRadius: 48,
              overflow: "hidden",
              backgroundColor: colors.cream,
              alignItems: "center",
              justifyContent: "center",
              opacity: isUploading ? 0.6 : 1,
            }}
          >
            {avatarUrl ? (
              <Image
                source={{ uri: avatarUrl }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
              />
            ) : (
              <UserRound size={40} color={colors.espresso} strokeWidth={1.6} />
            )}
            <View
              style={{
                position: "absolute",
                end: 15,
                bottom: 0,
                width: 25,
                height: 25,
                borderRadius: 15,
                backgroundColor: colors.espresso,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Pencil size={14} color="#fff" strokeWidth={2} />
            </View>
          </Pressable>
          <Text
            style={{
              color: colors.muted,
              fontSize: typography.caption,
              marginTop: spacing.sm,
            }}
          >
            {session?.user.email}
          </Text>
        </View>

        {/* Display name */}
        <Text
          style={[
            styles.sectionLabel,
            { color: colors.muted, marginBottom: spacing.xs },
          ]}
        >
          {t("account.profile")}
        </Text>
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: radius.lg,
            borderWidth: 1,
            borderColor: colors.line,
            padding: spacing.md,
            marginBottom: spacing.xl,
          }}
        >
          <Controller
            control={nameForm.control}
            name="fullName"
            render={({ field: { value, onChange, onBlur } }) => (
              <TextInput
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder={t("account.displayNamePlaceholder")}
                placeholderTextColor={colors.muted}
                style={[
                  styles.input,
                  { color: colors.ink, borderColor: colors.line },
                ]}
              />
            )}
          />
          {(nameForm.formState.errors.fullName || nameError) && (
            <Text
              style={{
                color: colors.danger,
                fontSize: typography.caption,
                marginTop: spacing.sm,
              }}
            >
              {t(nameForm.formState.errors.fullName?.message ?? nameError ?? "")}
            </Text>
          )}
          <Button
            label={isSavingName ? t("account.saving") : t("account.saveName")}
            onPress={nameForm.handleSubmit(onSaveName)}
            loading={isSavingName}
            variant="soft"
            style={{ marginTop: spacing.md }}
          />
        </View>

        {/* Password */}
        <Text
          style={[
            styles.sectionLabel,
            { color: colors.muted, marginBottom: spacing.xs },
          ]}
        >
          {t("account.password")}
        </Text>
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: radius.lg,
            borderWidth: 1,
            borderColor: colors.line,
            padding: spacing.md,
            marginBottom: spacing.xl,
          }}
        >
          <Controller
            control={passwordForm.control}
            name="password"
            render={({ field: { value, onChange, onBlur } }) => (
              <PasswordInput
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder={t("account.newPasswordPlaceholder")}
                containerStyle={{ marginBottom: spacing.sm }}
              />
            )}
          />
          {passwordForm.formState.errors.password && (
            <Text
              style={{ color: colors.danger, fontSize: typography.caption }}
            >
              {t(passwordForm.formState.errors.password.message ?? "")}
            </Text>
          )}
          <Controller
            control={passwordForm.control}
            name="confirm"
            render={({ field: { value, onChange, onBlur } }) => (
              <PasswordInput
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder={t("account.confirmPasswordPlaceholder")}
              />
            )}
          />
          {(passwordForm.formState.errors.confirm || passwordError) && (
            <Text
              style={{
                color: colors.danger,
                fontSize: typography.caption,
                marginTop: spacing.sm,
              }}
            >
              {t(passwordForm.formState.errors.confirm?.message ?? passwordError ?? "")}
            </Text>
          )}
          <Button
            label={isSavingPassword ? t("account.updating") : t("account.updatePassword")}
            onPress={passwordForm.handleSubmit(onChangePassword)}
            loading={isSavingPassword}
            variant="soft"
            style={{ marginTop: spacing.md }}
          />
        </View>

        {/* Danger zone */}
        <Text
          style={[
            styles.sectionLabel,
            { color: colors.danger, marginBottom: spacing.xs },
          ]}
        >
          {t("account.dangerZone")}
        </Text>
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: radius.lg,
            borderWidth: 1,
            borderColor: colors.line,
            padding: spacing.md,
          }}
        >
          <Text
            style={{
              color: colors.muted,
              fontSize: typography.caption,
              marginBottom: spacing.md,
            }}
          >
            {t("account.deleteCopy")}
          </Text>
          <Button
            label={t("account.deleteAccount")}
            onPress={onDeleteAccount}
            variant="danger"
          />
        </View>
      </FormScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
});
