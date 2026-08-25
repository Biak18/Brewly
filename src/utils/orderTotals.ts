// src/utils/orderTotals.ts
import { CartLineItem } from "@/stores/cartStore";

const TAX_RATE = 0.08;

// Flat city-wide delivery fee (USD). A store-configurable or distance-based
// fee can replace this later — the DB column already exists per-order.
export const DELIVERY_FEE = 1.5;

export function computeOrderTotals(items: CartLineItem[]) {
  const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
  const total = Math.round((subtotal + tax) * 100) / 100;
  return { subtotal, tax, total };
}
