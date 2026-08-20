// src/features/shops/components/ShopCard.tsx
import { Store } from "@/services/stores";
import { useTheme } from "@/theme";
import { MapPin, Store as StoreIcon } from "lucide-react-native";
import { memo, useCallback } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

type ShopCardProps = {
  store: Store;
  onPress: (id: string) => void;
  layout?: "row" | "list";
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function ShopCardComponent({ store, onPress, layout = "list" }: ShopCardProps) {
  const { colors, radius, spacing, typography } = useTheme();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const handlePress = useCallback(() => onPress(store.id), [onPress, store.id]);

  const shared = {
    accessibilityRole: "button" as const,
    accessibilityLabel: store.name,
    onPress: handlePress,
    onPressIn: () => {
      scale.value = withSpring(0.97);
    },
    onPressOut: () => {
      scale.value = withSpring(1);
    },
  };

  if (layout === "row") {
    return (
      <AnimatedPressable
        {...shared}
        style={[
          styles.rowCard,
          {
            borderColor: colors.line,
            backgroundColor: colors.surface,
            borderRadius: radius.xl,
          },
          animatedStyle,
        ]}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: radius.md,
            backgroundColor: colors.cream,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: spacing.sm,
          }}
        >
          <StoreIcon size={18} color={colors.espresso} strokeWidth={1.8} />
        </View>
        <Text
          style={{
            color: colors.ink,
            fontWeight: "800",
            fontSize: typography.bodySmall,
          }}
          numberOfLines={1}
        >
          {store.name}
        </Text>
        <Text
          style={{
            color: colors.muted,
            fontSize: typography.micro,
            marginTop: 2,
          }}
          numberOfLines={1}
        >
          {store.address}
        </Text>
      </AnimatedPressable>
    );
  }

  return (
    <AnimatedPressable
      {...shared}
      style={[
        styles.listCard,
        {
          borderColor: colors.line,
          backgroundColor: colors.surface,
          borderRadius: radius.xl,
        },
        animatedStyle,
      ]}
    >
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: radius.lg,
          backgroundColor: colors.cream,
          alignItems: "center",
          justifyContent: "center",
          marginRight: spacing.md,
        }}
      >
        <StoreIcon size={22} color={colors.espresso} strokeWidth={1.8} />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            color: colors.ink,
            fontWeight: "800",
            fontSize: typography.body,
          }}
        >
          {store.name}
        </Text>
        <View
          style={{ flexDirection: "row", alignItems: "center", marginTop: 2 }}
        >
          <MapPin size={11} color={colors.muted} strokeWidth={1.8} />
          <Text
            style={{
              color: colors.muted,
              fontSize: typography.caption,
              marginLeft: 4,
            }}
            numberOfLines={1}
          >
            {store.address}
          </Text>
        </View>
      </View>
    </AnimatedPressable>
  );
}

export const ShopCard = memo(
  ShopCardComponent,
  (prev, next) =>
    prev.store.id === next.store.id && prev.store.name === next.store.name,
);

const styles = StyleSheet.create({
  rowCard: { width: 140, borderWidth: 1, padding: 12 },
  listCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    padding: 10,
    marginBottom: 12,
  },
});
