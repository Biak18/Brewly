// src/tests/app/loyalty.test.tsx — smoke tests for src/app/loyalty.tsx
import LoyaltyScreen from "../../app/loyalty";
import { renderScreen } from "../../test/testUtils";

describe("<LoyaltyScreen />", () => {
  it("renders the header and empty state when signed out", async () => {
    const { findByText } = renderScreen(<LoyaltyScreen />);
    expect(await findByText("Loyalty cards")).toBeTruthy();
    expect(await findByText("No stamps yet")).toBeTruthy();
  });
});
