// src/utils/pricing.ts
import { CoffeeCardData } from "@/components/coffee/CoffeeCard";
import { Coffee, CoffeeWithStoreName } from "@/services/coffees";
import { Promotion } from "@/services/promotions";

// export function getCoffeeDiscount(
//   coffeeId: string,
//   categoryId: string,
//   promotions: Promotion[],
// ): Promotion | null {
//   return (
//     promotions.find((p) => p.scope === "coffee" && p.coffee_id === coffeeId) ??
//     promotions.find(
//       (p) => p.scope === "category" && p.category_id === categoryId,
//     ) ??
//     promotions.find((p) => p.scope === "all") ??
//     null
//   );
// }

export function getCoffeeDiscount(
  coffeeId: string,
  categoryId: string,
  storeId: string,
  promotions: Promotion[],
): Promotion | null {
  return (
    promotions.find(
      (p) =>
        p.scope === "coffee" &&
        p.coffee_id === coffeeId &&
        p.store_id === storeId,
    ) ??
    promotions.find(
      (p) =>
        p.scope === "category" &&
        p.category_id === categoryId &&
        p.store_id === storeId,
    ) ??
    promotions.find((p) => p.scope === "all" && p.store_id === storeId) ??
    null
  );
}

export function applyDiscount(basePrice: number, promo: Promotion | null) {
  if (!promo) return { finalPrice: basePrice, hasDiscount: false };
  const finalPrice =
    Math.round(basePrice * (1 - promo.discount_percent / 100) * 100) / 100;
  return { finalPrice, hasDiscount: true };
}

export function toCoffeeCardData(
  coffee: Coffee,
  promotions: Promotion[],
): CoffeeCardData {
  const { unitPrice, compareAtUnitPrice } = getCoffeePricing(
    coffee,
    promotions,
  );

  return {
    id: coffee.id,
    name: coffee.name,
    description: coffee.description ?? "",
    price: unitPrice,
    compareAtPrice: compareAtUnitPrice,
    imageUrl: coffee.image_url ?? "",
  };
}

export function getCoffeePricing(coffee: Coffee, promotions: Promotion[]) {
  const promo = getCoffeeDiscount(
    coffee.id,
    coffee.category_id,
    coffee.store_id,
    promotions,
  );
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

export function toCoffeeCardDataWithShop(
  coffee: CoffeeWithStoreName,
  promotions: Promotion[],
): CoffeeCardData {
  return {
    ...toCoffeeCardData(coffee, promotions),
    shopName: coffee.stores?.name,
  };
}
