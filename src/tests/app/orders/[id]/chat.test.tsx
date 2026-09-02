// src/tests/app/orders/[id]/chat.test.tsx: smoke tests for chat.tsx
import OrderChatScreen from "../../../../app/orders/[id]/chat";
import { createTestQueryClient } from "../../../../test/testUtils";
import { QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render } from "@testing-library/react-native";
import { router } from "expo-router";
import React from "react";

const mockOrder: any = {
  id: "test-id",
  user_id: "u1",
  store_id: "s1",
  driver_id: null,
};

function renderChat(order: any = mockOrder) {
  const qc = createTestQueryClient();
  qc.setQueryData(["orders", "detail", "test-id"], order);
  // also need store for chat title
  qc.setQueryData(["store", "s1"], { name: "Test Store", contact_phone: null });
  return render(
    <QueryClientProvider client={qc}>
      <OrderChatScreen />
    </QueryClientProvider>,
  );
}

describe("<OrderChatScreen /> safe back", () => {
  it("navigates back when history exists", async () => {
    (router.canGoBack as jest.Mock).mockReturnValue(true);
    (router.back as jest.Mock).mockClear();
    (router.replace as jest.Mock).mockClear();
    const { findByText, getByLabelText } = renderChat();
    await findByText(/Chat with/);
    fireEvent.press(getByLabelText("Back"));
    expect(router.back).toHaveBeenCalledTimes(1);
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("falls back to tabs when no history", async () => {
    (router.canGoBack as jest.Mock).mockReturnValue(false);
    (router.back as jest.Mock).mockClear();
    (router.replace as jest.Mock).mockClear();
    const { findByText, getByLabelText } = renderChat();
    await findByText(/Chat with/);
    fireEvent.press(getByLabelText("Back"));
    expect(router.replace).toHaveBeenCalledWith("/(tabs)");
    (router.canGoBack as jest.Mock).mockReturnValue(true);
  });
});
