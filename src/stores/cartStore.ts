// src/stores/cartStore.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type CartLineItem = {
  id: string;
  coffeeId: string;
  storeId: string;
  name: string;
  imageUrl: string;
  unitPrice: number;
  compareAtUnitPrice?: number;
  quantity: number;
  size?: string;
  temperature?: string;
  milk?: string;
  extras?: string[];
};

type CartState = {
  items: CartLineItem[];
  addItem: (
    item: Omit<CartLineItem, "id" | "quantity"> & { quantity?: number },
  ) => void;
  removeItem: (lineId: string) => void;
  setQuantity: (lineId: string, quantity: number) => void;
  updateItem: (lineId: string, patch: Partial<CartLineItem>) => void;
  clear: () => void;
};

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item) =>
        set((state) => ({
          items: [
            ...state.items,
            {
              ...item,
              id: `${item.coffeeId}-${Date.now()}`,
              quantity: item.quantity ?? 1,
            },
          ],
        })),
      removeItem: (lineId) =>
        set((state) => ({ items: state.items.filter((i) => i.id !== lineId) })),
      setQuantity: (lineId, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((i) => i.id !== lineId)
              : state.items.map((i) =>
                  i.id === lineId ? { ...i, quantity } : i,
                ),
        })),
      updateItem: (lineId, patch) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === lineId ? { ...item, ...patch } : item,
          ),
        })),
      clear: () => set({ items: [] }),
    }),
    {
      name: "brewly-cart",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ items: state.items }),
      version: 1,
    },
  ),
);

export const selectCartCount = (s: CartState) =>
  s.items.reduce((sum, i) => sum + i.quantity, 0);
export const selectCartTotal = (s: CartState) =>
  s.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

export function computeCartSavings(items: CartLineItem[]): number {
  return items.reduce(
    (sum, i) =>
      sum + ((i.compareAtUnitPrice ?? i.unitPrice) - i.unitPrice) * i.quantity,
    0,
  );
}

export const selectCartSavings = (s: CartState) => computeCartSavings(s.items);
