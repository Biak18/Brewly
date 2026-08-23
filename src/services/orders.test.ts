// src/services/orders.test.ts
import { CartLineItem } from "@/stores/cartStore";
import { computeOrderTotals } from "@/utils/orderTotals";

function makeLine(overrides: Partial<CartLineItem>): CartLineItem {
  return {
    id: "line-1",
    coffeeId: "c1",
    storeId: "s1",
    name: "Latte",
    imageUrl: "",
    unitPrice: 5,
    quantity: 1,
    ...overrides,
  };
}

describe("computeOrderTotals", () => {
  it("computes subtotal, 8% tax, and total", () => {
    const result = computeOrderTotals([
      makeLine({ unitPrice: 10, quantity: 1 }),
    ]);
    expect(result).toEqual({ subtotal: 10, tax: 0.8, total: 10.8 });
  });

  it("sums across multiple lines with different quantities", () => {
    expect(
      computeOrderTotals([
        makeLine({ unitPrice: 5, quantity: 2 }),
        makeLine({ unitPrice: 3, quantity: 3 }),
      ]).subtotal,
    ).toBe(19);
  });

  it("returns zeroes for an empty cart", () => {
    expect(computeOrderTotals([])).toEqual({ subtotal: 0, tax: 0, total: 0 });
  });
});
