// src/tests/app/orders/[id]/tracking.test.tsx — smoke tests for src/app/orders/[id]/tracking.tsx
import OrderTrackingScreen from "../../../../app/orders/[id]/tracking";
import { renderScreen } from "../../../../test/testUtils";

describe("<OrderTrackingScreen />", () => {
  it("shows the not-found state for an unknown order id", async () => {
    const { findByText } = renderScreen(<OrderTrackingScreen />);
    expect(await findByText("Order not found")).toBeTruthy();
  });
});
