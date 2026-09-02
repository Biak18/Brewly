import { render } from "@testing-library/react-native";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { create } from "zustand";
import { usePushNotifications } from "./usePushNotifications";

// Local auth-store mock: deterministic auth loading/session state without
// the real store's async getSession settling mid-test. The "mock" prefix is
// jest's whitelist for variables referenced inside a jest.mock factory, and
// the wrapper defers access past module init (jest.mock runs before consts).
type MockAuthState = {
  session: { user: { id: string } } | null;
  isLoading: boolean;
};

const mockUseAuthStore = create<MockAuthState>()(() => ({
  session: null,
  isLoading: true,
}));

jest.mock("@/stores/authStore", () => ({
  __esModule: true,
  useAuthStore: (
    ...args: Parameters<typeof mockUseAuthStore>
  ): ReturnType<typeof mockUseAuthStore> => mockUseAuthStore(...args),
}));

function Harness() {
  usePushNotifications();
  return null;
}

function responseWithOrderId(orderId: string) {
  return {
    notification: {
      request: { content: { data: { orderId } } },
    },
  };
}

function signIn() {
  mockUseAuthStore.setState({
    session: { user: { id: "user-1" } },
    isLoading: false,
  });
}

function flushAsync() {
  return new Promise<void>((resolve) => setImmediate(resolve));
}

describe("usePushNotifications", () => {
  const getLastResponse =
    Notifications.getLastNotificationResponseAsync as jest.Mock;
  const addResponseListener =
    Notifications.addNotificationResponseReceivedListener as jest.Mock;

  beforeEach(() => {
    getLastResponse.mockReset();
    getLastResponse.mockResolvedValue(null);
    addResponseListener.mockClear();
    (router.push as jest.Mock).mockClear();
    (router.replace as jest.Mock).mockClear();
    mockUseAuthStore.setState({ session: null, isLoading: true });
  });

  it("opens an order from a cold-start notification response", async () => {
    signIn();
    getLastResponse.mockResolvedValue(responseWithOrderId("order-42"));

    render(<Harness />);
    await flushAsync();

    expect(router.push).toHaveBeenCalledWith("/orders/order-42/tracking");
  });

  it("defers a cold-start tap until auth settles, then opens the order", async () => {
    getLastResponse.mockResolvedValue(responseWithOrderId("order-7"));

    render(<Harness />);
    await flushAsync();
    expect(router.push).not.toHaveBeenCalled();

    signIn();
    await flushAsync();

    expect(router.push).toHaveBeenCalledWith("/orders/order-7/tracking");
  });

  it("skips stale taps when the user is signed out after auth settles", async () => {
    getLastResponse.mockResolvedValue(responseWithOrderId("order-9"));

    render(<Harness />);
    await flushAsync();
    mockUseAuthStore.setState({ session: null, isLoading: false });
    await flushAsync();

    expect(router.push).not.toHaveBeenCalled();
  });

  it("opens an order when a running app receives a tap response", async () => {
    signIn();

    let listener: (response: unknown) => void = () => {};
    addResponseListener.mockImplementation(
      (cb: (response: unknown) => void) => {
        listener = cb;
        return { remove: jest.fn() };
      },
    );

    render(<Harness />);
    listener(responseWithOrderId("order-99"));

    expect(router.push).toHaveBeenCalledWith("/orders/order-99/tracking");
  });

  it("ignores responses without an orderId", async () => {
    signIn();
    getLastResponse.mockResolvedValue({
      notification: { request: { content: { data: {} } } },
    });

    render(<Harness />);
    await flushAsync();

    expect(router.push).not.toHaveBeenCalled();
  });

  it("removes the response listener when unmounted", () => {
    const remove = jest.fn();
    addResponseListener.mockReturnValue({ remove });

    const screen = render(<Harness />);
    screen.unmount();

    expect(remove).toHaveBeenCalledTimes(1);
  });
});
