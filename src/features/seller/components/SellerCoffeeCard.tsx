// src/features/seller/components/SellerCoffeeCard.tsx
import { CoffeeImage } from "@/components/coffee/CoffeeImage";
import { CoffeePrice } from "@/components/coffee/CoffeePrice";
import { Coffee } from "@/services/coffees";
import { useTheme } from "@/theme";
import { ImageOff } from "lucide-react-native";
import { memo, useCallback } from "react";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";

type SellerCoffeeCardProps = {
  coffee: Coffee;
  onPress: (id: string) => void;
  onToggleActive: (id: string, next: boolean) => void;
};

function SellerCoffeeCardComponent({
  coffee,
  onPress,
  onToggleActive,
}: SellerCoffeeCardProps) {
  const { colors, radius, spacing, typography } = useTheme();
  const handlePress = useCallback(
    () => onPress(coffee.id),
    [onPress, coffee.id],
  );
  const handleToggle = useCallback(
    (v: boolean) => onToggleActive(coffee.id, v),
    [onToggleActive, coffee.id],
  );
  const hasImage = !!coffee.image_url;

  return (
    <Pressable
      onPress={handlePress}
      style={[
        styles.card,
        {
          borderColor: colors.line,
          backgroundColor: colors.surface,
          borderRadius: radius.xl,
          opacity: coffee.is_active ? 1 : 0.55,
        },
      ]}
    >
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: radius.md,
          overflow: "hidden",
        }}
      >
        {hasImage ? (
          <CoffeeImage uri={coffee.image_url!} height={64} radius={radius.md} />
        ) : (
          <View
            style={{
              flex: 1,
              backgroundColor: colors.surface2,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ImageOff size={20} color={colors.muted} strokeWidth={1.6} />
          </View>
        )}
      </View>

      <View style={{ flex: 1, marginLeft: spacing.md }}>
        <Text
          style={{
            color: colors.ink,
            fontWeight: "800",
            fontSize: typography.bodySmall,
          }}
          numberOfLines={1}
        >
          {coffee.name}
        </Text>
        <View style={{ marginTop: 4 }}>
          <CoffeePrice value={coffee.base_price} size={12} />
        </View>
        {!hasImage && (
          <Text
            style={{
              color: colors.muted,
              fontSize: typography.micro,
              marginTop: 4,
              fontWeight: "700",
            }}
          >
            No image
          </Text>
        )}
      </View>

      <View style={{ alignItems: "center" }}>
        <Switch
          value={coffee.is_active}
          onValueChange={handleToggle}
          trackColor={{ true: colors.green, false: colors.line }}
        />
        <Text
          style={{
            color: colors.muted,
            fontSize: typography.micro,
            marginTop: 4,
          }}
        >
          {coffee.is_active ? "Active" : "Hidden"}
        </Text>
      </View>
    </Pressable>
  );
}

export const SellerCoffeeCard = memo(
  SellerCoffeeCardComponent,
  (prev, next) =>
    prev.coffee.id === next.coffee.id &&
    prev.coffee.is_active === next.coffee.is_active &&
    prev.coffee.base_price === next.coffee.base_price &&
    prev.coffee.name === next.coffee.name &&
    prev.coffee.image_url === next.coffee.image_url,
);

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
  },
});
