// src/tests/app/(tabs)/index.test.tsx — smoke tests for src/app/(tabs)/index.tsx
import HomeScreen from "../../../app/(tabs)/index";
import { renderScreen } from "../../../test/testUtils";

describe("<HomeScreen />", () => {
  it("renders the home feed without crashing", async () => {
    const { findByText } = renderScreen(<HomeScreen />);
    expect(await findByText("Yangon")).toBeTruthy();
  });
});
