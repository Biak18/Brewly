// src/app/(tabs)/_layout.tsx
import { useFavoriteIds } from "@/features/favorites/api/useFavorites";
import { ThemeColors } from "@/theme";
import { useThemeStore } from "@/theme/themeStore";
import { Tabs } from "expo-router";
import { Heart, Home, ReceiptText, Store, User } from "lucide-react-native";
import { Platform, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface TabBarIconProps {
  focused: boolean;
  children: React.ReactNode;
  colors: ThemeColors;
}

const TabBarIcon = ({ focused, children, colors }: TabBarIconProps) => {
  return (
    <View
      style={[
        {
          width: 40,
          height: 32,
          borderRadius: 16,
          alignItems: "center",
          justifyContent: "center",
        },
        focused && {
          backgroundColor: colors.cream,
        },
      ]}
    >
      {children}
    </View>
  );
};

export default function TabsLayout() {
  const colors = useThemeStore((s) => s.colors);
  const coffees = useFavoriteIds();
  const insets = useSafeAreaInsets();
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
            marginBottom:
              Platform.OS === "ios" ? 20 : Math.max(insets.bottom, 20),
            borderRadius: 20,
            marginHorizontal: 12,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ size, focused }) => (
              <TabBarIcon focused={focused} colors={colors}>
                <Home
                  color={focused ? colors.espresso : colors.muted}
                  size={size}
                  strokeWidth={1.8}
                />
              </TabBarIcon>
            ),
          }}
        />
        <Tabs.Screen
          name="shops"
          options={{
            title: "Shops",
            tabBarIcon: ({ size, focused }) => (
              <TabBarIcon focused={focused} colors={colors}>
                <Store
                  color={focused ? colors.espresso : colors.muted}
                  size={size}
                  strokeWidth={1.8}
                />
              </TabBarIcon>
            ),
          }}
        />
        <Tabs.Screen
          name="orders"
          options={{
            title: "Orders",
            tabBarIcon: ({ size, focused }) => (
              <TabBarIcon focused={focused} colors={colors}>
                <ReceiptText
                  color={focused ? colors.espresso : colors.muted}
                  size={size}
                  strokeWidth={1.8}
                />
              </TabBarIcon>
            ),
          }}
        />
        <Tabs.Screen
          name="favorites"
          options={{
            title: "Favorites",
            tabBarIcon: ({ size, focused }) => (
              <TabBarIcon focused={focused} colors={colors}>
                <Heart
                  color={focused ? colors.espresso : colors.muted}
                  size={size}
                  strokeWidth={1.8}
                />
              </TabBarIcon>
            ),
            tabBarBadge: coffees.data?.size || undefined,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ size, focused }) => (
              <TabBarIcon focused={focused} colors={colors}>
                <User
                  color={focused ? colors.espresso : colors.muted}
                  size={size}
                  strokeWidth={1.8}
                />
              </TabBarIcon>
            ),
          }}
        />
      </Tabs>
    </View>
  );
}
