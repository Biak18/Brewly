// src/tests/app/seller/promotions/index.test.tsx — smoke tests for src/app/seller/promotions/index.tsx
import ManagePromotionsScreen from "../../../../app/seller/promotions/index";
import { renderScreen } from "../../../../test/testUtils";

describe("<ManagePromotionsScreen />", () => {
  it("renders the manage promotions header and empty state", async () => {
    const { findByText } = renderScreen(<ManagePromotionsScreen />);
    expect(await findByText("Manage Promotions")).toBeTruthy();
    expect(await findByText("No promotions yet")).toBeTruthy();
  });
});
