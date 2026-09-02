// src/tests/components/OrderChat.test.tsx: smoke tests for the chat list
import { OrderChat } from "@/features/chat/components/OrderChat";
import { ChatMessage } from "@/services/chat";
import { renderScreen } from "../../test/testUtils";

jest.mock("@/services/chat", () => ({
  __esModule: true,
  CHAT_PAGE_SIZE: 2,
  fetchOrderMessages: jest.fn(async () => [
    {
      id: "m1",
      order_id: "o1",
      sender_id: "u-other",
      body: "Your order is ready!",
      created_at: new Date("2026-01-01T10:00:00Z").toISOString(),
      sender_name: "Shop",
    },
    {
      id: "m2",
      order_id: "o1",
      sender_id: "u-me",
      body: "On my way, thanks!",
      created_at: new Date("2026-01-01T10:01:00Z").toISOString(),
      sender_name: "Me",
    },
  ] satisfies ChatMessage[]),
  sendOrderMessage: jest.fn(async () => {}),
  subscribeOrderMessages: jest.fn(() => jest.fn()),
}));

// OrderChat is the only screen that calls useKeyboardHandler directly.
jest.mock("react-native-keyboard-controller", () => ({
  __esModule: true,
  useKeyboardHandler: jest.fn(),
}));

describe("<OrderChat />", () => {
  it("renders fetched messages", async () => {
    const { findByText } = renderScreen(
      <OrderChat orderId="o1" currentUserId="u-me" />,
    );
    expect(await findByText("Your order is ready!")).toBeTruthy();
    expect(await findByText("On my way, thanks!")).toBeTruthy();
  });

  it("offers to load earlier messages when a full page is returned", async () => {
    const { findByText } = renderScreen(
      <OrderChat orderId="o1" currentUserId="u-me" />,
    );
    // Two messages == CHAT_PAGE_SIZE in this mock → "load earlier" shows.
    expect(await findByText("Load earlier messages")).toBeTruthy();
  });
});
