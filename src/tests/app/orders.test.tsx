// src/tests/app/orders.test.tsx — smoke tests for src/app/(tabs)/orders.tsx
import OrdersScreen from "../../app/(tabs)/orders";
import { useAuthStore } from "../../stores/authStore";
import { renderScreen } from "../../test/testUtils";

const FILTER_LABELS = [
  "All",
  "Received",
  "Preparing",
  "Ready",
  "Completed",
  "Cancelled",
];

describe("<OrdersScreen />", () => {
  afterEach(() => {
    useAuthStore.setState({ session: null, profile: null });
  });

  it("shows the empty state and status filters for a signed-out buyer", async () => {
    const { findByText, getByText } = renderScreen(<OrdersScreen />);
    expect(await findByText("No orders yet")).toBeTruthy();
    for (const label of FILTER_LABELS) {
      expect(getByText(label)).toBeTruthy();
    }
  });

  it("shows the seller view toggle with the shop-orders empty state", async () => {
    useAuthStore.setState({
      session: { user: { id: "u1" } } as any,
      profile: { id: "u1", full_name: null, role: "seller" },
    });
    const { findByText, getByText } = renderScreen(<OrdersScreen />);
    expect(await findByText("My Shop")).toBeTruthy();
    expect(getByText("My Purchases")).toBeTruthy();
    // Sellers default to the shop view
    expect(
      await findByText("Orders placed at your shop will show up here.")
    ).toBeTruthy();
  });
});
