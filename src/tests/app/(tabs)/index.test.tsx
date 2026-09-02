// src/tests/app/(tabs)/index.test.tsx: smoke tests for src/app/(tabs)/index.tsx
import HomeScreen from "../../../app/(tabs)/index";
import { renderScreen } from "../../../test/testUtils";

describe("<HomeScreen />", () => {
  it("renders the home feed without crashing", async () => {
    const { findAllByText } = renderScreen(<HomeScreen />);
    // "Yangon" legitimately appears twice (header location + promo banner
    // fallback), so assert at least one match instead of a unique one.
    const matches = await findAllByText("Yangon");
    expect(matches.length).toBeGreaterThan(0);
  });
});
