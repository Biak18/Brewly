// src/components/cart/FloatingCartButton.tsx
import { selectCartCount, useCartStore } from "@/stores/cartStore";
import { useTheme } from "@/theme";
import * as Haptics from "expo-haptics";
import { usePathname, useRouter } from "expo-router";
import { ShoppingBag } from "lucide-react-native";
import { useEffect } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TAB_ROUTES = ["/", "/menu", "/orders", "/favorites", "/profile"];

const HIDDEN_ROUTE_PREFIXES = ["/cart", "/checkout", "/coffee"];

export function FloatingCartButton() {
  const { colors, shadows } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const count = useCartStore(selectCartCount);
  const scale = useSharedValue(1);

  const isHidden = HIDDEN_ROUTE_PREFIXES.some((p) => pathname.startsWith(p));
  const isOnTabScreen = TAB_ROUTES.includes(pathname);

  useEffect(() => {
    if (count > 0)
      scale.value = withSequence(
        withSpring(1.15, { damping: 8 }),
        withSpring(1, { damping: 10 }),
      );
  }, [count, scale]);

  const bottomOffset = isOnTabScreen ? 80 + insets.bottom : insets.bottom + 120;
  const translateY = useSharedValue(bottomOffset);

  useEffect(() => {
    translateY.value = withTiming(bottomOffset, {
      duration: 300,
    });
  }, [bottomOffset]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: -translateY.value }],
  }));

  if (count === 0 || isHidden) return null;

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        { position: "absolute", end: 20, /*bottom: bottomOffset*/ bottom: 0 },
        animatedStyle,
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`View cart, ${count} item${count === 1 ? "" : "s"}`}
        onPress={() => {
          Haptics.selectionAsync();
          router.push("/cart");
        }}
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: colors.espresso,
          alignItems: "center",
          justifyContent: "center",
          boxShadow: shadows.large,
        }}
      >
        <ShoppingBag size={24} color={colors.surface} strokeWidth={1.8} />
        <View
          style={{
            position: "absolute",
            top: -4,
            end: -4,
            minWidth: 20,
            height: 20,
            borderRadius: 10,
            backgroundColor: colors.danger,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 4,
            borderWidth: 2,
            borderColor: colors.bg,
          }}
        >
          <Text style={{ color: "#fff", fontSize: 11, fontWeight: "800" }}>
            {count > 99 ? "99+" : count}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}
