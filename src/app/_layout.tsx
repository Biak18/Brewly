// src/app/_layout.tsx
import { CartPreviewSheet } from "@/components/cart/CartPreviewSheet";
import { FloatingCartButton } from "@/components/cart/FloatingCartButton";
import { ConfirmDialogHost } from "@/components/ui/ConfirmDialog";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { OfflineBanner } from "@/components/ui/OfflineBanner";
import { ToastHost } from "@/components/ui/Toast";
import { useOrdersRealtimeSync } from "@/features/orders/hooks/useOrdersRealtimeSync";
import { usePromotionsRealtimeSync } from "@/features/promotions/hooks/usePromotionsRealtimeSync";
import { useAuthDeepLink } from "@/hooks/useAuthDeepLink";
import { useNetworkSync } from "@/hooks/useNetworkSync";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useAuthStore } from "@/stores/authStore";
import { useLanguageStore } from "@/stores/languageStore";
import { useOnboardingStore } from "@/stores/onboardingStore";
import { useThemeStore } from "@/theme/themeStore";
import "@/i18n";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000, retry: 2 } },
});

function RootNavigator() {
  useOrdersRealtimeSync();
  usePromotionsRealtimeSync();
  useAuthDeepLink();
  useNetworkSync();
  usePushNotifications();
  const colors = useThemeStore((s) => s.colors);
  const session = useAuthStore((s) => s.session);
  const profile = useAuthStore((s) => s.profile);
  const isLoading = useAuthStore((s) => s.isLoading);
  const hasThemeHydrated = useThemeStore((s) => s.hasHydrated);
  const hasOnboardingHydrated = useOnboardingStore((s) => s.hasHydrated);
  const hasOnboarded = useOnboardingStore((s) => s.hasOnboarded);
  const isPasswordRecovery = useAuthStore((s) => s.isPasswordRecovery);

  useEffect(() => {
    useLanguageStore.getState().initLanguage();
  }, []);

  useEffect(() => {
    if (!isLoading && hasThemeHydrated && hasOnboardingHydrated)
      SplashScreen.hideAsync();
  }, [isLoading, hasThemeHydrated, hasOnboardingHydrated]);

  if (isLoading || !hasThemeHydrated || !hasOnboardingHydrated)
    return <LoadingScreen />;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Protected guard={isPasswordRecovery}>
          <Stack.Screen name="reset-password" />
        </Stack.Protected>
        <Stack.Protected guard={!hasOnboarded && !isPasswordRecovery}>
          <Stack.Screen name="onboarding" />
        </Stack.Protected>
        <Stack.Protected
          guard={!!session && !isPasswordRecovery && hasOnboarded}
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="coffee/[id]" options={{ animation: "none" }} />
          <Stack.Screen name="cart" />
          <Stack.Screen name="checkout" />
          <Stack.Screen name="addresses" />
          <Stack.Screen
            name="orders/[id]/tracking"
            options={{
              animation: "slide_from_right",
              animationDuration: 400,
            }}
          />
          <Stack.Screen
            name="orders/[id]/chat"
            options={{
              animation: "slide_from_right",
              animationDuration: 400,
            }}
          />
          <Stack.Screen name="shop/[id]" />
          <Stack.Screen name="my-store" />
          <Stack.Screen name="become-seller" />
          <Stack.Screen
            name="search"
            options={{
              animation: "slide_from_right",
              animationDuration: 50,
            }}
          />
        </Stack.Protected>
        <Stack.Protected
          guard={!session && !isPasswordRecovery && hasOnboarded}
        >
          <Stack.Screen name="sign-in" />
          <Stack.Screen name="forgot-password" />
          <Stack.Screen name="sign-up" />
        </Stack.Protected>
        <Stack.Protected
          guard={!!session && !isPasswordRecovery && profile?.role === "seller"}
        >
          <Stack.Screen name="seller/menu/index" />
          <Stack.Screen name="seller/menu/coffee-form" />
          <Stack.Screen name="seller/menu/options" />
          <Stack.Screen name="seller/promotions/index" />
          <Stack.Screen name="seller/promotions/form" />
        </Stack.Protected>
      </Stack>
      <CartPreviewSheet />
      <FloatingCartButton />
      <ToastHost />
      <ConfirmDialogHost />
      <OfflineBanner />
    </View>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <KeyboardProvider>
          <QueryClientProvider client={queryClient}>
            <ErrorBoundary>
              <RootNavigator />
            </ErrorBoundary>
          </QueryClientProvider>
        </KeyboardProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
