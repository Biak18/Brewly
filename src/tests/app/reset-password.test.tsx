// src/tests/app/reset-password.test.tsx: smoke tests for src/app/reset-password.tsx
import ResetPasswordScreen from "../../app/reset-password";
import { renderScreen } from "../../test/testUtils";

describe("<ResetPasswordScreen />", () => {
  it("renders the new password form", async () => {
    const { findByText } = renderScreen(<ResetPasswordScreen />);
    expect(await findByText("Set a new password")).toBeTruthy();
    expect(await findByText("Update password")).toBeTruthy();
  });
});
