// src/app/(tabs)/_layout.tsx
import { useFavoriteIds } from "@/features/favorites/api/useFavorites";
import { ThemeColors } from "@/theme";
import { useThemeStore } from "@/theme/themeStore";
import { Tabs } from "expo-router";
import {
  Heart,
  Home,
  LucideIcon,
  ReceiptText,
  Store,
  User,
} from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TABS = [
  { name: "index", label: "Home", Icon: Home },
  { name: "shops", label: "Shops", Icon: Store },
  { name: "orders", label: "Orders", Icon: ReceiptText },
  { name: "favorites", label: "Favorites", Icon: Heart },
  { name: "profile", label: "Profile", Icon: User },
] as const;

const SPRING = { damping: 24, stiffness: 140, mass: 1 } as const;

type Route = { key: string; name: string };
type BottomTabBarProps = {
  state: { index: number; routes: Route[] };
  descriptors: Record<string, { options?: { tabBarBadge?: number | string } }>;
  navigation: { navigate: (name: string) => void };
};

type TabButtonProps = {
  Icon: LucideIcon;
  label: string;
  focused: boolean;
  badge?: number | string;
  colors: ThemeColors;
  index: number;
  onLayout: (index: number, x: number, width: number) => void;
  onPress: () => void;
};

function TabButton({
  Icon,
  label,
  focused,
  badge,
  colors,
  index,
  onLayout,
  onPress,
}: TabButtonProps) {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withSpring(focused ? 1.18 : 1, SPRING);
  }, [focused, scale]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const color = focused ? colors.espresso : colors.muted;

  return (
    <Pressable
      onPress={onPress}
      onLayout={(e) =>
        onLayout(index, e.nativeEvent.layout.x, e.nativeEvent.layout.width)
      }
      style={styles.tabButton}
      hitSlop={8}
    >
      <Animated.View style={iconStyle}>
        <Icon color={color} size={22} strokeWidth={1.8} />
      </Animated.View>
      <Text
        style={[styles.tabLabel, { color, opacity: focused ? 1 : 0.65 }]}
        numberOfLines={1}
      >
        {label}
      </Text>
      {badge ? (
        <View style={[styles.badge, { backgroundColor: colors.danger }]}>
          <Text style={styles.badgeText}>
            {typeof badge === "number" && badge > 9 ? "9+" : badge}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const colors = useThemeStore((s) => s.colors);
  const insets = useSafeAreaInsets();
  const measurements = useRef<{ x: number; width: number }[]>([]);
  const indicatorX = useSharedValue(0);
  const indicatorW = useSharedValue(0);
  const [ready, setReady] = useState(false);

  const activeIndex = state.index;

  const goTo = (idx: number) => {
    const m = measurements.current[idx];
    if (!m) return;
    indicatorX.value = withSpring(m.x, SPRING);
    indicatorW.value = withSpring(m.width, SPRING);
  };

  useEffect(() => {
    if (ready) goTo(activeIndex);
  }, [activeIndex, ready]);

  const onMeasure = (index: number, x: number, width: number) => {
    measurements.current[index] = { x, width };
    if (measurements.current.filter(Boolean).length === TABS.length) {
      setReady(true);
      goTo(activeIndex);
    }
  };

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
    width: indicatorW.value,
  }));

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: colors.surface,
          borderColor: colors.line,
          marginBottom: Math.max(insets.bottom, 12),
        },
      ]}
    >
      <View style={styles.row}>
        <Animated.View
          style={[
            styles.indicator,
            { backgroundColor: colors.cream },
            indicatorStyle,
          ]}
        />
        {TABS.map((t, i) => {
          const routeIndex = state.routes.findIndex((r) => r.name === t.name);
          const route = state.routes[routeIndex];
          const focused = routeIndex === activeIndex;
          const badge = descriptors[route.key]?.options?.tabBarBadge;
          return (
            <TabButton
              key={t.name}
              Icon={t.Icon}
              label={t.label}
              focused={focused}
              badge={badge as number | string | undefined}
              colors={colors}
              index={i}
              onLayout={onMeasure}
              onPress={() => navigation.navigate(t.name)}
            />
          );
        })}
      </View>
    </View>
  );
}

export default function TabsLayout() {
  const coffees = useFavoriteIds();
  return (
    <View
      style={{ flex: 1, backgroundColor: useThemeStore((s) => s.colors).bg }}
    >
      <Tabs
        screenOptions={{
          animation: "none",
          headerShown: false,
        }}
        tabBar={(props) => <CustomTabBar {...props} />}
      >
        <Tabs.Screen name="index" options={{ title: "Home" }} />
        <Tabs.Screen name="shops" options={{ title: "Shops" }} />
        <Tabs.Screen name="orders" options={{ title: "Orders" }} />
        <Tabs.Screen
          name="favorites"
          options={{
            title: "Favorites",
            tabBarBadge: coffees.data?.size || undefined,
          }}
        />
        <Tabs.Screen name="profile" options={{ title: "Profile" }} />
      </Tabs>
    </View>
  );
}

const styles = {
  bar: {
    marginHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 10,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  row: {
    position: "relative" as const,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    paddingHorizontal: 8,
  },
  indicator: {
    position: "absolute" as const,
    top: 0,
    bottom: 0,
    left: 0,
    borderRadius: 16,
  },
  tabButton: {
    flex: 1,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    paddingVertical: 8,
    gap: 3,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: "700" as const,
  },
  badge: {
    position: "absolute" as const,
    top: 2,
    right: "28%" as const,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "800" as const,
  },
};
