// src/tests/app/cart.test.tsx — smoke tests for src/app/cart.tsx
import CartScreen from "../../app/cart";
import { useCartStore } from "../../stores/cartStore";
import { renderScreen } from "../../test/testUtils";

jest.mock("react-native-gesture-handler/ReanimatedSwipeable", () => {
  // require() inside a jest.mock factory is intentional (imports are illegal there)
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require("react");
  return {
    __esModule: true,
    default: ({ children }: { children?: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
  };
});

function seedCart() {
  useCartStore.setState({
    items: [
      {
        id: "line-1",
        coffeeId: "c1",
        storeId: "s1",
        name: "Latte",
        imageUrl: "",
        unitPrice: 4.5,
        compareAtUnitPrice: 5,
        quantity: 2,
      },
    ],
  });
}

describe("<CartScreen />", () => {
  afterEach(() => {
    useCartStore.setState({ items: [] });
  });

  it("shows the empty state with a browse action", async () => {
    const { findByText, getByText } = renderScreen(<CartScreen />);
    expect(await findByText("Your cart is empty")).toBeTruthy();
    expect(getByText("Browse menu")).toBeTruthy();
  });

  it("lists cart lines with savings, total, and checkout button", async () => {
    seedCart();
    const { findByText, getByText, findAllByText } = renderScreen(
      <CartScreen />,
    );
    expect(await findByText("Latte")).toBeTruthy();
    // Line total and cart total coincide at $9.00
    expect((await findAllByText("$9.00")).length).toBeGreaterThan(0);
    expect(getByText("Total")).toBeTruthy();
    expect(getByText("You're saving")).toBeTruthy();
    expect(getByText("$1.00")).toBeTruthy();
    expect(getByText("Proceed to checkout")).toBeTruthy();
  });
});
