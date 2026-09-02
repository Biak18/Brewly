// src/tests/app/(tabs)/orders.test.tsx: smoke tests for src/app/(tabs)/orders.tsx
import OrdersScreen from "../../../app/(tabs)/orders";
import { renderScreen } from "../../../test/testUtils";

describe("<OrdersScreen />", () => {
  it("shows the empty state when there are no orders", async () => {
    const { findByText } = renderScreen(<OrdersScreen />);
    expect(await findByText("No orders yet")).toBeTruthy();
  });
});
