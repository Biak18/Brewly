// src/components/coffee/CoffeeCard.tsx
import { useTheme } from "@/theme";
import { memo, useCallback } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { AddToCartButton } from "./AddToCartButton";
import { CoffeeImage } from "./CoffeeImage";
import { CoffeePrice } from "./CoffeePrice";
import { FavoriteButton } from "./FavoriteButton";

export type CoffeeCardData = {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  compareAtPrice?: number;
};

type CoffeeCardProps = {
  coffee: CoffeeCardData;
  liked: boolean;
  onPress: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onAddToCart: (id: string) => void;
  layout?: "row" | "grid";
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function CoffeeCardComponent({
  coffee,
  liked,
  onPress,
  onToggleFavorite,
  onAddToCart,
  layout,
}: CoffeeCardProps) {
  const { colors, radius, spacing, typography } = useTheme();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = useCallback(
    () => onPress(coffee.id),
    [onPress, coffee.id],
  );
  const handleToggle = useCallback(
    () => onToggleFavorite(coffee.id),
    [onToggleFavorite, coffee.id],
  );
  const handleAdd = useCallback(
    () => onAddToCart(coffee.id),
    [onAddToCart, coffee.id],
  );

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={`${coffee.name}, $${coffee.price.toFixed(2)}`}
      onPress={handlePress}
      onPressIn={() => {
        scale.value = withSpring(0.98);
      }}
      onPressOut={() => {
        scale.value = withSpring(1);
      }}
      style={[
        styles.card,
        layout === "grid" ? styles.cardGrid : styles.cardRow,
        {
          borderColor: colors.line,
          backgroundColor: colors.surface,
          borderRadius: radius.xl,
        },
        animatedStyle,
      ]}
    >
      <View>
        <CoffeeImage uri={coffee.imageUrl} radius={radius.xl} />
        <View style={styles.heartSlot}>
          <FavoriteButton liked={liked} onToggle={handleToggle} />
        </View>
      </View>
      <View style={{ padding: spacing.md }}>
        <Text
          style={{
            color: colors.ink,
            fontSize: typography.body,
            fontWeight: "800",
          }}
          numberOfLines={1}
        >
          {coffee.name}
        </Text>
        <Text
          style={{
            color: colors.muted,
            fontSize: typography.micro,
            marginTop: 5,
            marginBottom: spacing.md,
            minHeight: 29,
          }}
          numberOfLines={2}
        >
          {coffee.description}
        </Text>
        <View style={styles.foot}>
          <CoffeePrice
            value={coffee.price}
            compareAtValue={coffee.compareAtPrice}
          />
          <AddToCartButton onPress={handleAdd} />
        </View>
      </View>
    </AnimatedPressable>
  );
}

export const CoffeeCard = memo(
  CoffeeCardComponent,
  (prev, next) => prev.coffee === next.coffee && prev.liked === next.liked,
);

const styles = StyleSheet.create({
  card: { borderWidth: 1, overflow: "hidden" },
  cardRow: { width: 202 },
  cardGrid: { flex: 1 },
  heartSlot: { position: "absolute", end: 10, top: 10 }, // was `right: 10`
  foot: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});
