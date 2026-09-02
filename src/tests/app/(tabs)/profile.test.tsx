// src/tests/app/(tabs)/profile.test.tsx: smoke tests for src/app/(tabs)/profile.tsx
import ProfileScreen from "../../../app/(tabs)/profile";
import { renderScreen } from "../../../test/testUtils";

describe("<ProfileScreen />", () => {
  it("renders preferences and the sign out button", async () => {
    const { findByText } = renderScreen(<ProfileScreen />);
    expect(await findByText("Preferences")).toBeTruthy();
    expect(await findByText("Sign out")).toBeTruthy();
  });
});
