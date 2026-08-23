// src/tests/app/checkout.test.tsx — smoke tests for src/app/checkout.tsx
import CheckoutScreen from "../../app/checkout";
import { renderScreen } from "../../test/testUtils";

describe("<CheckoutScreen />", () => {
  it("renders the checkout form with an order summary", async () => {
    const { findAllByText } = renderScreen(<CheckoutScreen />);
    await findAllByText("Checkout");
  });

  it("shows the place order button", async () => {
    const { findByText } = renderScreen(<CheckoutScreen />);
    expect(await findByText("Place order")).toBeTruthy();
  });
});
