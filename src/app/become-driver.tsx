// src/app/become-driver.tsx
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { registerAsDriver } from "@/services/orders";
import { refreshProfile } from "@/stores/authStore";
import { useToastStore } from "@/stores/toastStore";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/theme";
import { useRouter } from "expo-router";
import { ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft } from "lucide-react-native";
import { useState } from "react";

export default function BecomeDriverScreen() {
  const { colors, spacing, radius, typography } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const showToast = useToastStore((s) => s.show);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [vehicle, setVehicle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegister = async () => {
    setIsSubmitting(true);
    try {
      await registerAsDriver({ fullName, phone, vehicle });
      await refreshProfile();
      showToast(t("driver.registered"));
      router.replace("/(driver)" as any);
    } catch {
      showToast(t("tracking.couldNotAssignDriver"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputStyle = {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    color: colors.ink,
    paddingHorizontal: spacing.md,
    height: 46,
    fontSize: typography.bodySmall,
  } as const;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
        }}
      >
        <IconButton accessibilityLabel={t("common.back")} onPress={() => router.back()}>
          <ChevronLeft size={20} color={colors.ink} strokeWidth={2} />
        </IconButton>
        <Text
          style={{
            marginLeft: spacing.sm,
            color: colors.ink,
            fontSize: typography.body,
            fontWeight: "800",
          }}
        >
          {t("driver.becomeDriver")}
        </Text>
      </View>
      <ScrollView
        contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg }}
      >
        <Text style={{ color: colors.muted, fontSize: typography.bodySmall }}>
          {t("driver.becomeDriverDesc")}
        </Text>
        <View style={{ gap: spacing.xs }}>
          <Text style={{ color: colors.muted, fontSize: typography.caption }}>
            {t("driver.name")}
          </Text>
          <TextInput
            value={fullName}
            onChangeText={setFullName}
            placeholder={t("driver.name")}
            placeholderTextColor={colors.muted}
            style={inputStyle}
          />
        </View>
        <View style={{ gap: spacing.xs }}>
          <Text style={{ color: colors.muted, fontSize: typography.caption }}>
            {t("driver.phone")}
          </Text>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder={t("driver.phone")}
            placeholderTextColor={colors.muted}
            keyboardType="phone-pad"
            style={inputStyle}
          />
        </View>
        <View style={{ gap: spacing.xs }}>
          <Text style={{ color: colors.muted, fontSize: typography.caption }}>
            {t("driver.vehicle")}
          </Text>
          <TextInput
            value={vehicle}
            onChangeText={setVehicle}
            placeholder={t("driver.vehicle")}
            placeholderTextColor={colors.muted}
            style={inputStyle}
          />
        </View>
        <Button
          label={t("driver.register")}
          onPress={handleRegister}
          loading={isSubmitting}
          variant="primary"
        />
      </ScrollView>
    </SafeAreaView>
  );
}
