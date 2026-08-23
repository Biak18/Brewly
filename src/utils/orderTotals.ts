// src/utils/orderTotals.ts
import { CartLineItem } from "@/stores/cartStore";

const TAX_RATE = 0.08;

export function computeOrderTotals(items: CartLineItem[]) {
  const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
  const total = Math.round((subtotal + tax) * 100) / 100;
  return { subtotal, tax, total };
}
