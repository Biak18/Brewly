// src/tests/app/(tabs)/shops.test.tsx: smoke tests for src/app/(tabs)/shops.tsx
import ShopsScreen from "../../../app/(tabs)/shops";
import { renderScreen } from "../../../test/testUtils";

describe("<ShopsScreen />", () => {
  it("shows the empty state when no shops exist", async () => {
    const { findByText } = renderScreen(<ShopsScreen />);
    expect(await findByText("No shops yet")).toBeTruthy();
  });
});
