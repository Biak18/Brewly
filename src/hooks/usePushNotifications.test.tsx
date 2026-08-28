import { render } from "@testing-library/react-native";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { usePushNotifications } from "./usePushNotifications";

function Harness() {
  usePushNotifications();
  return null;
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
  });

  it("opens an order from a cold-start notification response", async () => {
    getLastResponse.mockResolvedValue({
      notification: {
        request: { content: { data: { orderId: "order-42" } } },
      },
    });

    render(<Harness />);
    await new Promise<void>((resolve) => setImmediate(resolve));

    expect(router.push).toHaveBeenCalledWith("/orders/order-42/tracking");
  });

  it("removes the response listener when unmounted", () => {
    const remove = jest.fn();
    addResponseListener.mockReturnValue({ remove });

    const screen = render(<Harness />);
    screen.unmount();

    expect(remove).toHaveBeenCalledTimes(1);
  });
});
