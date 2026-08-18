// src/hooks/useCartAwareBottomInset.ts
import { selectCartCount, useCartStore } from "@/stores/cartStore";

const FAB_CLEARANCE = 76; // 56px button + 20px bottom margin, from FloatingCartButton

export function useCartAwareBottomInset(): number {
  const count = useCartStore(selectCartCount);
  return count > 0 ? FAB_CLEARANCE : 0;
}
