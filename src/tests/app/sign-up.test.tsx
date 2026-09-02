// src/tests/app/sign-up.test.tsx: smoke tests for src/app/sign-up.tsx
import SignUpScreen from "../../app/sign-up";
import { renderScreen } from "../../test/testUtils";

describe("<SignUpScreen />", () => {
  it("renders the create account form", async () => {
    const { findByText } = renderScreen(<SignUpScreen />);
    expect(await findByText("Create your account")).toBeTruthy();
    expect(await findByText("Create account")).toBeTruthy();
  });
});
