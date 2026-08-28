import * as Notifications from "expo-notifications";
import { ensureNotificationPermission } from "./notifications";

describe("ensureNotificationPermission", () => {
  const getPermissions = Notifications.getPermissionsAsync as jest.Mock;
  const requestPermissions = Notifications.requestPermissionsAsync as jest.Mock;

  beforeEach(() => {
    getPermissions.mockReset();
    requestPermissions.mockReset();
  });

  it("returns true without requesting when permission is already granted", async () => {
    getPermissions.mockResolvedValue({ granted: true, canAskAgain: true });

    await expect(ensureNotificationPermission()).resolves.toBe(true);
    expect(requestPermissions).not.toHaveBeenCalled();
  });

  it("requests permission when the OS allows another prompt", async () => {
    getPermissions.mockResolvedValue({ granted: false, canAskAgain: true });
    requestPermissions.mockResolvedValue({ granted: true });

    await expect(ensureNotificationPermission()).resolves.toBe(true);
    expect(requestPermissions).toHaveBeenCalledTimes(1);
  });

  it("returns false without requesting when permission cannot be requested", async () => {
    getPermissions.mockResolvedValue({ granted: false, canAskAgain: false });

    await expect(ensureNotificationPermission()).resolves.toBe(false);
    expect(requestPermissions).not.toHaveBeenCalled();
  });
});
