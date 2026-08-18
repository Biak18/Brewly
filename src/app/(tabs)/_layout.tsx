// src/app/(tabs)/_layout.tsx
import { useFavoriteIds } from "@/features/favorites/api/useFavorites";
import { useThemeStore } from "@/theme/themeStore";
import { Tabs } from "expo-router";
import { Coffee, Heart, Home, ReceiptText, User } from "lucide-react-native";
import { View } from "react-native";

export default function TabsLayout() {
  const colors = useThemeStore((s) => s.colors);
  const coffees = useFavoriteIds();
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Tabs
        screenOptions={{
          // animation: "fade",
          headerShown: false,
          tabBarActiveTintColor: colors.espresso,
          tabBarInactiveTintColor: colors.muted,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.line,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color, size }) => (
              <Home color={color} size={size} strokeWidth={1.8} />
            ),
          }}
        />
        <Tabs.Screen
          name="menu"
          options={{
            title: "Menu",
            tabBarIcon: ({ color, size }) => (
              <Coffee color={color} size={size} strokeWidth={1.8} />
            ),
          }}
        />
        <Tabs.Screen
          name="orders"
          options={{
            title: "Orders",
            tabBarIcon: ({ color, size }) => (
              <ReceiptText color={color} size={size} strokeWidth={1.8} />
            ),
          }}
        />
        <Tabs.Screen
          name="favorites"
          options={{
            title: "Favorites",
            tabBarIcon: ({ color, size }) => (
              <Heart color={color} size={size} strokeWidth={1.8} />
            ),
            tabBarBadge: coffees.data?.size || undefined,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color, size }) => (
              <User color={color} size={size} strokeWidth={1.8} />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}
