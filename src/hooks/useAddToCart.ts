// src/hooks/useAddToCart.ts
import { CartLineItem, useCartStore } from "@/stores/cartStore";
import { useUIStore } from "@/stores/uiStore";
import { useCallback } from "react";
import { Alert } from "react-native";

type AddToCartInput = Omit<CartLineItem, "id" | "quantity"> & {
  quantity?: number;
  force?: boolean;
};

export function useAddToCart() {
  const items = useCartStore((s) => s.items);
  const addItem = useCartStore((s) => s.addItem);
  const clearCart = useCartStore((s) => s.clear);
  const openCartPreview = useUIStore((s) => s.openCartPreview);

  return useCallback(
    (input: AddToCartInput) => {
      const existingStoreId = items[0]?.storeId;
      if (existingStoreId && existingStoreId !== input.storeId) {
        Alert.alert(
          "Start a new cart?",
          "Your cart has items from a different shop. Pickup orders can only come from one shop at a time — adding this will clear your current cart.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Clear cart & add",
              style: "destructive",
              onPress: () => {
                clearCart();
                addItem(input);
                openCartPreview();
              },
            },
          ],
        );
        return;
      }
      addItem(input);
      if (input.force) openCartPreview();
    },
    [items, addItem, clearCart, openCartPreview],
  );
}
