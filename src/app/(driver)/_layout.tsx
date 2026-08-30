// src/app/(driver)/_layout.tsx
import { useThemeStore } from "@/theme/themeStore";
import { useTranslation } from "react-i18next";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useCallback } from "react";
import { BackHandler, Pressable } from "react-native";

export default function DriverLayout() {
  const colors = useThemeStore((s) => s.colors);
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

  const headerLeft = () => (
    <Pressable
      onPress={goBack}
      hitSlop={12}
      accessibilityLabel={t("common.back")}
    >
      <ChevronLeft size={24} color={colors.ink} strokeWidth={2} />
    </Pressable>
  );

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.ink,
        headerTitleStyle: { color: colors.ink, fontWeight: "700" },
        contentStyle: { backgroundColor: colors.bg },
        headerLeft,
      }}
    >
      <Stack.Screen name="index" options={{ title: t("driver.title") }} />
      <Stack.Screen name="[id]" options={{ title: t("driver.delivery") }} />
    </Stack>
  );
}
