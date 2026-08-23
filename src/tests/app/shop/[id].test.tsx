// src/tests/app/shop/[id].test.tsx — smoke tests for src/app/shop/[id].tsx
import ShopMenuScreen from "../../../app/shop/[id]";
import { renderScreen } from "../../../test/testUtils";

describe("<ShopMenuScreen />", () => {
  it("renders the menu header and empty state", async () => {
    const { findByText } = renderScreen(<ShopMenuScreen />);
    expect(await findByText("Menu")).toBeTruthy();
    expect(await findByText("No coffee found")).toBeTruthy();
  });
});
