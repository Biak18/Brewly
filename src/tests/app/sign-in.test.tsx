// src/tests/app/sign-in.test.tsx — smoke tests for src/app/sign-in.tsx
import SignInScreen from "../../app/sign-in";
import { renderScreen } from "../../test/testUtils";

describe("<SignInScreen />", () => {
  it("renders the sign in form", async () => {
    const { findByText } = renderScreen(<SignInScreen />);
    expect(await findByText("Brewly")).toBeTruthy();
    expect(await findByText("Sign in")).toBeTruthy();
  });
});
