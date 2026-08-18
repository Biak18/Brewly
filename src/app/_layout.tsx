// src/app/_layout.tsx — remove the auth useEffect and the now-unused `supabase` import
import { CartPreviewSheet } from "@/components/cart/CartPreviewSheet";
import { FloatingCartButton } from "@/components/cart/FloatingCartButton";
import { useOrdersRealtimeSync } from "@/features/orders/hooks/useOrdersRealtimeSync";
import { usePromotionsRealtimeSync } from "@/features/promotions/hooks/usePromotionsRealtimeSync";
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
  const colors = useThemeStore((s) => s.colors);
  const session = useAuthStore((s) => s.session);
  const isLoading = useAuthStore((s) => s.isLoading);

  useEffect(() => {
    if (!isLoading) SplashScreen.hideAsync();
  }, [isLoading]);

  // No auth subscription here — this component only ever reads session/isLoading.
  // authStore.ts owns writing to them exclusively.

  if (isLoading) return null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Protected guard={!!session}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="coffee/[id]" />
          <Stack.Screen name="cart" />
          <Stack.Screen name="checkout" />
          <Stack.Screen name="orders/[id]/tracking" />
        </Stack.Protected>
        <Stack.Protected guard={!session}>
          <Stack.Screen name="sign-in" />
        </Stack.Protected>
      </Stack>
      <CartPreviewSheet />
      <FloatingCartButton />
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
