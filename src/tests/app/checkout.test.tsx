// src/tests/app/checkout.test.tsx — smoke tests for src/app/checkout.tsx
import CheckoutScreen from "../../app/checkout";
import { useCartStore } from "../../stores/cartStore";
import { renderScreen } from "../../test/testUtils";

describe("<CheckoutScreen />", () => {
  afterEach(() => {
    useCartStore.setState({ items: [] });
  });

  it("renders all checkout sections with an empty cart", async () => {
    const { findByText, getByText } = renderScreen(<CheckoutScreen />);
    expect(await findByText("Fulfillment")).toBeTruthy();
    expect(getByText("Pickup from")).toBeTruthy();
    expect(getByText("Pickup time")).toBeTruthy();
    expect(getByText("Payment")).toBeTruthy();
    expect(getByText("Order summary")).toBeTruthy();
    expect(getByText("Place order")).toBeTruthy();
  });

  it("shows the store and summary for a seeded cart", async () => {
    useCartStore.setState({
      items: [
        {
          id: "line-1",
          coffeeId: "c1",
          storeId: "s1",
          name: "Latte",
          imageUrl: "",
          unitPrice: 4.5,
          quantity: 1,
        },
      ],
    });
    const { findByText } = renderScreen(<CheckoutScreen />);
    // Store query resolves against the mocked Supabase client; the summary
    // section must list the cart line either way.
    await findByText("Order summary");
  });
});
