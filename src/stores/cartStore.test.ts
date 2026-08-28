// src/stores/cartStore.test.ts
import { selectCartSavings, selectCartTotal, useCartStore } from "./cartStore";

beforeEach(() => {
  useCartStore.setState({ items: [], activeUserId: null, carts: {} });
});

describe("cartStore", () => {
  it("adds an item with a default quantity of 1", () => {
    useCartStore.getState().addItem({
      coffeeId: "c1",
      storeId: "s1",
      name: "Latte",
      imageUrl: "",
      unitPrice: 5,
    });
    expect(useCartStore.getState().items).toHaveLength(1);
    expect(useCartStore.getState().items[0].quantity).toBe(1);
  });

  it("setQuantity to 0 removes the line instead of leaving a zero-quantity row", () => {
    useCartStore.getState().addItem({
      coffeeId: "c1",
      storeId: "s1",
      name: "Latte",
      imageUrl: "",
      unitPrice: 5,
    });
    const lineId = useCartStore.getState().items[0].id;
    useCartStore.getState().setQuantity(lineId, 0);
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it("removeItem removes only the targeted line", () => {
    useCartStore.getState().addItem({
      coffeeId: "c1",
      storeId: "s1",
      name: "Latte",
      imageUrl: "",
      unitPrice: 5,
    });
    useCartStore.getState().addItem({
      coffeeId: "c2",
      storeId: "s1",
      name: "Mocha",
      imageUrl: "",
      unitPrice: 6,
    });
    useCartStore.getState().removeItem(useCartStore.getState().items[0].id);
    expect(useCartStore.getState().items).toHaveLength(1);
    expect(useCartStore.getState().items[0].name).toBe("Mocha");
  });

  it("selectCartTotal sums unitPrice * quantity across lines", () => {
    useCartStore.getState().addItem({
      coffeeId: "c1",
      storeId: "s1",
      name: "Latte",
      imageUrl: "",
      unitPrice: 5,
      quantity: 2,
    });
    useCartStore.getState().addItem({
      coffeeId: "c2",
      storeId: "s1",
      name: "Mocha",
      imageUrl: "",
      unitPrice: 6,
      quantity: 1,
    });
    expect(selectCartTotal(useCartStore.getState())).toBe(16);
  });

  it("selectCartSavings reflects the gap between compareAtUnitPrice and unitPrice", () => {
    useCartStore.getState().addItem({
      coffeeId: "c1",
      storeId: "s1",
      name: "Latte",
      imageUrl: "",
      unitPrice: 4,
      compareAtUnitPrice: 5,
      quantity: 2,
    });
    expect(selectCartSavings(useCartStore.getState())).toBe(2);
  });

  it("keeps carts separate when switching accounts", () => {
    useCartStore.getState().setCartUser("customer-1");
    useCartStore.getState().addItem({
      coffeeId: "c1",
      storeId: "s1",
      name: "Latte",
      imageUrl: "",
      unitPrice: 5,
    });

    useCartStore.getState().setCartUser("seller-1");
    expect(useCartStore.getState().items).toHaveLength(0);

    useCartStore.getState().setCartUser("customer-1");
    expect(useCartStore.getState().items[0].name).toBe("Latte");
  });
});
