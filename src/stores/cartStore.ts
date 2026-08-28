// src/stores/cartStore.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type CartLineItem = {
  id: string;
  coffeeId: string;
  storeId: string;
  categoryId?: string | null;
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
  activeUserId: string | null;
  carts: Record<string, CartLineItem[]>;
  setCartUser: (userId: string | null) => void;
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
      activeUserId: null,
      carts: {},
      setCartUser: (userId) =>
        set((state) => ({
          activeUserId: userId,
          carts:
            state.activeUserId && state.activeUserId !== userId
              ? { ...state.carts, [state.activeUserId]: state.items }
              : state.carts,
          items: userId ? (state.carts[userId] ?? []) : [],
        })),
      addItem: (item) =>
        set((state) => {
          const items = [
            ...state.items,
            {
              ...item,
              id: `${item.coffeeId}-${Date.now()}`,
              quantity: item.quantity ?? 1,
            },
          ];
          return {
            items,
            carts: state.activeUserId
              ? { ...state.carts, [state.activeUserId]: items }
              : state.carts,
          };
        }),
      removeItem: (lineId) =>
        set((state) => {
          const items = state.items.filter((i) => i.id !== lineId);
          return {
            items,
            carts: state.activeUserId
              ? { ...state.carts, [state.activeUserId]: items }
              : state.carts,
          };
        }),
      setQuantity: (lineId, quantity) =>
        set((state) => {
          const items =
            quantity <= 0
              ? state.items.filter((i) => i.id !== lineId)
              : state.items.map((i) =>
                  i.id === lineId ? { ...i, quantity } : i,
                );
          return {
            items,
            carts: state.activeUserId
              ? { ...state.carts, [state.activeUserId]: items }
              : state.carts,
          };
        }),
      updateItem: (lineId, patch) =>
        set((state) => {
          const items = state.items.map((item) =>
            item.id === lineId ? { ...item, ...patch } : item,
          );
          return {
            items,
            carts: state.activeUserId
              ? { ...state.carts, [state.activeUserId]: items }
              : state.carts,
          };
        }),
      clear: () =>
        set((state) => ({
          items: [],
          carts: state.activeUserId
            ? { ...state.carts, [state.activeUserId]: [] }
            : state.carts,
        })),
    }),
    {
      name: "brewly-cart",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ carts: state.carts }),
      version: 2,
      migrate: (persistedState) => ({
        items: [],
        activeUserId: null,
        carts:
          (
            persistedState as
              | { carts?: Record<string, CartLineItem[]> }
              | undefined
          )?.carts ?? {},
      }),
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
