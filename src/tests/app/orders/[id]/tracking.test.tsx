// src/tests/app/orders/[id]/tracking.test.tsx — smoke tests for tracking.tsx
import OrderTrackingScreen from "../../../../app/orders/[id]/tracking";
import { OrderWithItems } from "../../../../services/orders";
import { createTestQueryClient } from "../../../../test/testUtils";
import { QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react-native";
import React from "react";

const mockOrder: OrderWithItems = {
  id: "test-id",
  status: "preparing",
  user_id: "u1",
  store_id: "s1",
  fulfillment: "pickup",
  subtotal: 9,
  tax: 0.45,
  total: 9.45,
  discount: 0,
  tip: 0,
  promo_code: null,
  delivery_fee: 0,
  delivery_address: null,
  placed_at: new Date("2026-01-01T10:00:00Z").toISOString(),
  payment_method: "cash",
  payment_status: "unpaid",
  payment_ref: null,
  driver_id: null,
  drivers: null,
  order_items: [
    {
      id: "oi1",
      coffee_id: "c1",
      size: null,
      temperature: null,
      milk: null,
      extras: [],
      quantity: 2,
      unit_price: 4.5,
      compare_at_price: null,
      coffees: { name: "Latte", image_url: null },
    },
  ],
};

function renderWithOrder(order: OrderWithItems | undefined) {
  const queryClient = createTestQueryClient();
  if (order) {
    queryClient.setQueryData(["orders", "detail", "test-id"], order);
  }
  return {
    ...render(
      <QueryClientProvider client={queryClient}>
        <OrderTrackingScreen />
      </QueryClientProvider>,
    ),
    queryClient,
  };
}

describe("<OrderTrackingScreen />", () => {
  it("shows the not-found state when the order cannot be resolved", async () => {
    const { findByText } = renderWithOrder(undefined);
    expect(await findByText("Order not found")).toBeTruthy();
  });

  it("renders the seeded order with items and totals", async () => {
    const { findByText, getByText, findAllByText } = renderWithOrder(mockOrder);
    expect(await findByText("Order tracking")).toBeTruthy();
    expect(getByText("Items")).toBeTruthy();
    // Items are rendered as "<quantity>× <name>"
    expect((await findAllByText(/Latte/)).length).toBeGreaterThan(0);
    expect(getByText("Subtotal")).toBeTruthy();
  });
});
