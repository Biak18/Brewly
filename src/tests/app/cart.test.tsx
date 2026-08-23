// src/tests/app/cart.test.tsx — smoke tests for src/app/cart.tsx
import CartScreen from "../../app/cart";
import { renderScreen } from "../../test/testUtils";

describe("<CartScreen />", () => {
  it("shows the empty state when the cart has no items", async () => {
    const { findByText } = renderScreen(<CartScreen />);
    expect(await findByText("Your cart is empty")).toBeTruthy();
  });
});
