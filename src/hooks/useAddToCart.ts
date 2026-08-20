// src/hooks/useAddToCart.ts
import { CartLineItem, useCartStore } from "@/stores/cartStore";
import { useConfirmDialogStore } from "@/stores/confirmDialogStore";
import { useUIStore } from "@/stores/uiStore";
import { useCallback } from "react";

type AddToCartInput = Omit<CartLineItem, "id" | "quantity"> & {
  quantity?: number;
  force?: boolean;
};

export function useAddToCart() {
  const items = useCartStore((s) => s.items);
  const addItem = useCartStore((s) => s.addItem);
  const clearCart = useCartStore((s) => s.clear);
  const openCartPreview = useUIStore((s) => s.openCartPreview);
  const showConfirm = useConfirmDialogStore((s) => s.show);

  return useCallback(
    (input: AddToCartInput) => {
      const existingStoreId = items[0]?.storeId;
      if (existingStoreId && existingStoreId !== input.storeId) {
        showConfirm({
          title: "Start a new cart?",
          message:
            "Your cart has items from a different shop. Pickup orders can only come from one shop at a time — adding this will clear your current cart.",
          confirmLabel: "Clear cart & add",
          destructive: true,
          onConfirm: () => {
            clearCart();
            addItem(input);
            openCartPreview();
          },
        });
        return;
      }
      addItem(input);
      if (input.force) openCartPreview();
    },
    [items, addItem, clearCart, openCartPreview, showConfirm],
  );
}
