// src/tests/app/forgot-password.test.tsx: smoke tests for src/app/forgot-password.tsx
import ForgotPasswordScreen from "../../app/forgot-password";
import { renderScreen } from "../../test/testUtils";

describe("<ForgotPasswordScreen />", () => {
  it("renders the reset password form", async () => {
    const { findByText } = renderScreen(<ForgotPasswordScreen />);
    expect(await findByText("Reset password")).toBeTruthy();
    expect(await findByText("Send reset link")).toBeTruthy();
  });
});
