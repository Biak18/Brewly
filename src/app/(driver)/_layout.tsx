// src/app/(driver)/_layout.tsx
import { IconButton } from "@/components/ui/IconButton";
import { useTheme } from "@/theme";
import { useTranslation } from "react-i18next";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useCallback } from "react";
import { BackHandler } from "react-native";

export default function DriverLayout() {
  const { colors, typography } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();

  // The driver stack can be cold-started from a restored URL with empty history
  // (Expo dev client persists last route) — fall back to tabs instead of
  // letting back exit the app or emit GO_BACK not handled.
  const goBack = useCallback(() => {
    try {
      if (router.canGoBack()) router.back();
      else router.replace("/(tabs)" as any);
    } catch {
      router.replace("/(tabs)" as any);
    }
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        goBack();
        return true;
      });
      return () => sub.remove();
    }, [goBack]),
  );

  const headerLeft = () => {
    // Only show a polished back button when there is history; the
    // driver index is a stack root and should not render a back arrow.
    try {
      if (!router.canGoBack()) return null as unknown as React.ReactElement;
    } catch {
      return null as unknown as React.ReactElement;
    }
    return (
      <IconButton accessibilityLabel={t("common.back")} onPress={goBack}>
        <ChevronLeft size={20} color={colors.ink} strokeWidth={2} />
      </IconButton>
    );
  };

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.ink,
        headerTitleStyle: {
          color: colors.ink,
          fontSize: typography.subheading,
          fontWeight: "800",
        },
        headerTitleAlign: "center",
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.bg },
        headerLeft,
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen
        name="index"
        options={{ title: t("driver.title"), headerLeft: () => null }}
      />
      <Stack.Screen name="[id]" options={{ title: t("driver.delivery") }} />
    </Stack>
  );
}
