// src/features/coffee/components/DetailFooterBar.tsx
import { CoffeePrice } from "@/components/coffee/CoffeePrice";
import { Button } from "@/components/ui/Button";
import { useTheme } from "@/theme";
import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from "react-native-reanimated";

type DetailFooterBarProps = {
  total: number;
  compareAtTotal?: number;
  onAddToCart: () => void;
};

export function DetailFooterBar({
  total,
  compareAtTotal,
  onAddToCart,
}: DetailFooterBarProps) {
  const { colors, spacing } = useTheme();
  const bump = useSharedValue(1);

  useEffect(() => {
    bump.value = withSequence(
      withSpring(1.08, { damping: 8 }),
      withSpring(1, { damping: 10 }),
    );
  }, [total, bump]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: bump.value }],
  }));

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: spacing.md,
        padding: spacing.xl,
        borderTopWidth: 1,
        borderTopColor: colors.line,
        backgroundColor: colors.surface,
      }}
    >
      <Animated.View style={[style, { flex: 1, minWidth: 0 }]}>
        <CoffeePrice
          value={total}
          compareAtValue={compareAtTotal}
          size={22}
          stacked
        />
      </Animated.View>
      <View style={{ flexGrow: 1, maxWidth: 180 }}>
        <Button label="Add to cart" onPress={onAddToCart} variant="primary" />
      </View>
    </View>
  );
}
