// src/utils/pricing.test.ts
import { Coffee } from "@/services/coffees";
import { Promotion } from "@/services/promotions";
import { applyDiscount, getCoffeeDiscount, getCoffeePricing } from "./pricing";

function makePromotion(overrides: Partial<Promotion>): Promotion {
  return {
    id: 1,
    title: "Test",
    description: "Test promo",
    discount_percent: 20,
    scope: "all",
    category_id: null,
    coffee_id: null,
    starts_at: "2020-01-01",
    ends_at: "2099-01-01",
    is_active: true,
    store_id: "store-a",
    created_at: "2020-01-01",
    target_key: null,
    ...overrides,
  };
}

function makeCoffee(overrides: Partial<Coffee>): Coffee {
  return {
    id: "coffee-1",
    category_id: "cat-1",
    store_id: "store-a",
    name: "Latte",
    description: null,
    base_price: 5,
    image_url: null,
    rating: null,
    is_featured: false,
    is_active: true,
    ...overrides,
  };
}

describe("getCoffeeDiscount", () => {
  it("applies a store-wide promo to a coffee in that store", () => {
    const promo = makePromotion({ scope: "all", store_id: "store-a" });
    expect(getCoffeeDiscount("coffee-1", "cat-1", "store-a", [promo])).toBe(
      promo,
    );
  });

  it("does NOT apply a store-wide promo from a different store — this is the exact bug that shipped once already", () => {
    const promoFromOtherStore = makePromotion({
      scope: "all",
      store_id: "store-b",
    });
    expect(
      getCoffeeDiscount("coffee-1", "cat-1", "store-a", [promoFromOtherStore]),
    ).toBeNull();
  });

  it("prefers a coffee-specific promo over a category or store-wide one", () => {
    const storeWide = makePromotion({
      scope: "all",
      store_id: "store-a",
      id: 1,
    });
    const categoryPromo = makePromotion({
      scope: "category",
      category_id: "cat-1",
      store_id: "store-a",
      id: 2,
    });
    const coffeePromo = makePromotion({
      scope: "coffee",
      coffee_id: "coffee-1",
      store_id: "store-a",
      id: 3,
    });
    expect(
      getCoffeeDiscount("coffee-1", "cat-1", "store-a", [
        storeWide,
        categoryPromo,
        coffeePromo,
      ])?.id,
    ).toBe(3);
  });

  it("returns null when nothing matches", () => {
    expect(getCoffeeDiscount("coffee-1", "cat-1", "store-a", [])).toBeNull();
  });
});

describe("applyDiscount", () => {
  it("returns the base price unchanged with no promo", () => {
    expect(applyDiscount(10, null)).toEqual({
      finalPrice: 10,
      hasDiscount: false,
    });
  });

  it("applies a percentage discount correctly", () => {
    expect(applyDiscount(10, makePromotion({ discount_percent: 20 }))).toEqual({
      finalPrice: 8,
      hasDiscount: true,
    });
  });

  it("rounds to two decimal places", () => {
    const result = applyDiscount(9.99, makePromotion({ discount_percent: 33 }));
    expect(result.finalPrice).toBeCloseTo(6.69, 2);
  });
});

describe("getCoffeePricing", () => {
  it("sets compareAtUnitPrice only when a discount actually applies", () => {
    const coffee = makeCoffee({ base_price: 5 });
    expect(getCoffeePricing(coffee, []).compareAtUnitPrice).toBeUndefined();

    const withPromo = getCoffeePricing(coffee, [
      makePromotion({
        scope: "all",
        store_id: "store-a",
        discount_percent: 10,
      }),
    ]);
    expect(withPromo.unitPrice).toBe(4.5);
    expect(withPromo.compareAtUnitPrice).toBe(5);
  });
});
