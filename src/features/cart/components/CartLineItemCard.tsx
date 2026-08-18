// src/features/cart/components/CartLineItemCard.tsx
import { CoffeeImage } from "@/components/coffee/CoffeeImage";
import { CoffeePrice } from "@/components/coffee/CoffeePrice";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { CartLineItem } from "@/stores/cartStore";
import { useTheme } from "@/theme";
import * as Haptics from "expo-haptics";
import { Trash2 } from "lucide-react-native";
import { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import Animated, {
  FadeOut,
  LinearTransition,
  SharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";

type CartLineItemCardProps = {
  item: CartLineItem;
  onRemove: (lineId: string) => void;
  onQuantityChange: (lineId: string, quantity: number) => void;
};

function DeleteAction({
  progress,
  onPress,
}: {
  progress: SharedValue<number>;
  onPress: () => void;
}) {
  const { colors, radius } = useTheme();
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: progress.value }],
    opacity: progress.value,
  }));
  return (
    <Animated.View
      style={[
        styles.deleteAction,
        { backgroundColor: colors.danger, borderRadius: radius.lg },
        style,
      ]}
    >
      <Pressable
        onPress={() => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          onPress();
        }}
        style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        accessibilityLabel="Remove item"
      >
        <Trash2 size={20} color="#fff" strokeWidth={2} />
      </Pressable>
    </Animated.View>
  );
}

function CartLineItemCardComponent({
  item,
  onRemove,
  onQuantityChange,
}: CartLineItemCardProps) {
  const { colors, spacing, radius, typography } = useTheme();
  const optionsSummary = [
    item.size,
    item.temperature,
    item.milk,
    ...(item.extras ?? []),
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Animated.View
      exiting={FadeOut.duration(200)}
      layout={LinearTransition.springify()}
    >
      <ReanimatedSwipeable
        renderRightActions={(progress) => (
          <DeleteAction progress={progress} onPress={() => onRemove(item.id)} />
        )}
        overshootRight={false}
      >
        <View
          style={[
            styles.row,
            {
              backgroundColor: colors.surface,
              borderColor: colors.line,
              borderRadius: radius.lg,
              padding: spacing.md,
            },
          ]}
        >
          <CoffeeImage uri={item.imageUrl} height={64} radius={radius.md} />
          <View style={{ flex: 1, marginLeft: spacing.md }}>
            <Text
              style={{
                color: colors.ink,
                fontSize: typography.body,
                fontWeight: "800",
              }}
              numberOfLines={1}
            >
              {item.name}
            </Text>
            {optionsSummary.length > 0 && (
              <Text
                style={{
                  color: colors.muted,
                  fontSize: typography.micro,
                  marginTop: 2,
                }}
                numberOfLines={1}
              >
                {optionsSummary}
              </Text>
            )}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: spacing.sm,
              }}
            >
              <QuantityStepper
                value={item.quantity}
                onChange={(q) => onQuantityChange(item.id, q)}
              />
              <CoffeePrice
                value={item.unitPrice * item.quantity}
                compareAtValue={
                  item.compareAtUnitPrice
                    ? item.compareAtUnitPrice * item.quantity
                    : undefined
                }
              />
            </View>
          </View>
        </View>
      </ReanimatedSwipeable>
    </Animated.View>
  );
}

export const CartLineItemCard = memo(
  CartLineItemCardComponent,
  (prev, next) =>
    prev.item.id === next.item.id &&
    prev.item.quantity === next.item.quantity &&
    prev.item.unitPrice === next.item.unitPrice,
);

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", borderWidth: 1 },
  deleteAction: { width: 56, marginLeft: 8, borderRadius: 14 },
});
