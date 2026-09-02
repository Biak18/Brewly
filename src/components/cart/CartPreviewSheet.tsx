// src/components/cart/CartPreviewSheet.tsx
import { CoffeeImage } from "@/components/coffee/CoffeeImage";
import { CoffeePrice } from "@/components/coffee/CoffeePrice";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import {
  CartLineItem,
  selectCartSavings,
  selectCartTotal,
  useCartStore,
} from "@/stores/cartStore";
import { useUIStore } from "@/stores/uiStore";
import { useTheme } from "@/theme";
import { formatCurrency } from "@/utils/currency";
import { useRouter } from "expo-router";
import { FlatList, Text, View } from "react-native";

export function CartPreviewSheet() {
  const { colors, spacing, typography, radius } = useTheme();
  const router = useRouter();
  const isOpen = useUIStore((s) => s.isCartPreviewOpen);
  const close = useUIStore((s) => s.closeCartPreview);
  const items = useCartStore((s) => s.items);
  const total = useCartStore(selectCartTotal);
  const savings = useCartStore(selectCartSavings);
  const recent = items.slice(-3);

  return (
    <BottomSheet visible={isOpen} onClose={close}>
      <View style={{ paddingHorizontal: spacing.xl }}>
        <Text
          style={{
            color: colors.ink,
            fontSize: typography.subheading,
            fontWeight: "800",
            marginBottom: spacing.md,
          }}
        >
          Added to cart
        </Text>
        <FlatList showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false}
 data={recent}
 keyExtractor={(i) => i.id}
 scrollEnabled={false}
 renderItem={({ item }: { item: CartLineItem }) => (
 <View
 style={{
 flexDirection: "row",
 alignItems: "center",
 marginBottom: spacing.sm,
 }}
 >
 <CoffeeImage uri={item.imageUrl} height={40} radius={radius.sm} />
              <Text
                style={{
                  flex: 1,
                  marginLeft: spacing.sm,
                  color: colors.ink,
                  fontSize: typography.bodySmall,
                }}
                numberOfLines={1}
              >
                {item.quantity}× {item.name}
              </Text>
              <CoffeePrice value={item.unitPrice * item.quantity} size={12} />
            </View>
          )}
        />
        {savings > 0 && (
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginBottom: spacing.xs,
            }}
          >
            <Text
              style={{
                color: colors.green,
                fontSize: typography.caption,
                fontWeight: "600",
              }}
            >
              You&apos;re saving
            </Text>
            <Text
              style={{
                color: colors.green,
                fontSize: typography.caption,
                fontWeight: "800",
              }}
            >
              {formatCurrency(savings)}
            </Text>
          </View>
        )}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginTop: spacing.md,
            marginBottom: spacing.lg,
          }}
        >
          <Text style={{ color: colors.muted, fontSize: typography.body }}>
            Cart total
          </Text>
          <CoffeePrice value={total} size={16} />
        </View>
        <Button
          label="View cart"
          variant="primary"
          onPress={() => {
            close();
            router.push("/cart");
          }}
        />
      </View>
    </BottomSheet>
  );
}
