// src/app/_layout.tsx
import { CartPreviewSheet } from "@/components/cart/CartPreviewSheet";
import { FloatingCartButton } from "@/components/cart/FloatingCartButton";
import { ConfirmDialogHost } from "@/components/ui/ConfirmDialog";
import { ToastHost } from "@/components/ui/Toast";
import { useOrdersRealtimeSync } from "@/features/orders/hooks/useOrdersRealtimeSync";
import { usePromotionsRealtimeSync } from "@/features/promotions/hooks/usePromotionsRealtimeSync";
import { useAuthDeepLink } from "@/hooks/useAuthDeepLink";
import { useAuthStore } from "@/stores/authStore";
import { useThemeStore } from "@/theme/themeStore";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
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
  const colors = useThemeStore((s) => s.colors);
  const session = useAuthStore((s) => s.session);
  const profile = useAuthStore((s) => s.profile);
  const isLoading = useAuthStore((s) => s.isLoading);
  const isPasswordRecovery = useAuthStore((s) => s.isPasswordRecovery);

  useEffect(() => {
    if (!isLoading) SplashScreen.hideAsync();
  }, [isLoading]);

  if (isLoading) return null;

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
        <Stack.Protected guard={!!session && !isPasswordRecovery}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="coffee/[id]" options={{ animation: "none" }} />
          <Stack.Screen name="cart" />
          <Stack.Screen name="checkout" />
          <Stack.Screen name="orders/[id]/tracking" />
          <Stack.Screen name="shop/[id]" />
          <Stack.Screen name="my-store" />
        </Stack.Protected>
        <Stack.Protected guard={!session && !isPasswordRecovery}>
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
        </Stack.Protected>
      </Stack>
      <CartPreviewSheet />
      <FloatingCartButton />
      <ToastHost />
      <ConfirmDialogHost />
    </View>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <RootNavigator />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
