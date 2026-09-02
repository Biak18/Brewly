// src/tests/app/(driver)/[id].test.tsx: smoke tests for the driver delivery detail
import DriverDeliveryScreen from "../../../app/(driver)/[id]";
import { OrderWithItems } from "../../../services/orders";
import { createTestQueryClient } from "../../../test/testUtils";
import { QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react-native";
import React from "react";

const mockDelivery: OrderWithItems = {
  id: "test-id",
  status: "driver_assigned",
  user_id: "u1",
  store_id: "s1",
  fulfillment: "delivery",
  subtotal: 9,
  tax: 0.45,
  total: 10.95,
  discount: 0,
  tip: 0,
  promo_code: null,
  delivery_fee: 1.5,
  delivery_address: "123 Bahan Road, Yangon",
  delivery_lat: 16.8409,
  delivery_lng: 96.1735,
  placed_at: new Date("2026-01-01T10:00:00Z").toISOString(),
  payment_method: "cash",
  payment_status: "unpaid",
  payment_ref: null,
  driver_id: "d1",
  drivers: { full_name: "Aung Kyaw", phone: "09123456789" },
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
  return render(
    <QueryClientProvider client={queryClient}>
      <DriverDeliveryScreen />
    </QueryClientProvider>,
  );
}

describe("<DriverDeliveryScreen />", () => {
  it("renders the delivery address, items, and next-step actions", async () => {
    const { findByText } = renderWithOrder(mockDelivery);
    expect(await findByText("123 Bahan Road, Yangon")).toBeTruthy();
    expect(await findByText("Open in Google Maps")).toBeTruthy();
    expect(await findByText("Mark out for delivery")).toBeTruthy();
  });

  it("renders nothing to act on while the order is loading", () => {
    const { queryByText } = renderWithOrder(undefined);
    expect(queryByText("Mark out for delivery")).toBeNull();
  });
});
