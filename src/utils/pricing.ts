// src/utils/pricing.ts
import { CoffeeCardData } from "@/components/coffee/CoffeeCard";
import { Coffee } from "@/services/coffees";
import { Promotion } from "@/services/promotions";

export function getCoffeeDiscount(
  coffeeId: string,
  categoryId: string,
  promotions: Promotion[],
): Promotion | null {
  // Most-specific match wins: a promo targeted at this exact coffee beats a
  // category-wide one, which beats a store-wide one.
  return (
    promotions.find((p) => p.scope === "coffee" && p.coffee_id === coffeeId) ??
    promotions.find(
      (p) => p.scope === "category" && p.category_id === categoryId,
    ) ??
    promotions.find((p) => p.scope === "all") ??
    null
  );
}

export function applyDiscount(basePrice: number, promo: Promotion | null) {
  if (!promo) return { finalPrice: basePrice, hasDiscount: false };
  const finalPrice =
    Math.round(basePrice * (1 - promo.discount_percent / 100) * 100) / 100;
  return { finalPrice, hasDiscount: true };
}

// Single source of truth for "coffee → card display data" — used by every
// screen that renders a CoffeeCard, so pricing logic exists in exactly one
// place instead of being copy-pasted into Home/Menu/Favorites independently.
export function toCoffeeCardData(
  coffee: Coffee,
  promotions: Promotion[],
): CoffeeCardData {
  const promo = getCoffeeDiscount(coffee.id, coffee.category_id, promotions);
  const { finalPrice, hasDiscount } = applyDiscount(coffee.base_price, promo);

  return {
    id: coffee.id,
    name: coffee.name,
    description: coffee.description ?? "",
    price: finalPrice,
    compareAtPrice: hasDiscount ? coffee.base_price : undefined,
    imageUrl: coffee.image_url ?? "",
  };
}

export function getCoffeePricing(
  coffee: Coffee,
  promotions: Promotion[],
): { unitPrice: number; compareAtUnitPrice?: number } {
  const promo = getCoffeeDiscount(coffee.id, coffee.category_id, promotions);
  const { finalPrice, hasDiscount } = applyDiscount(coffee.base_price, promo);
  return {
    unitPrice: finalPrice,
    compareAtUnitPrice: hasDiscount ? coffee.base_price : undefined,
  };
}

export function getEffectivePrice(
  coffee: Coffee,
  promotions: Promotion[],
): number {
  return getCoffeePricing(coffee, promotions).unitPrice;
}
