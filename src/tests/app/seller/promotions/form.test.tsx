// src/tests/app/seller/promotions/form.test.tsx: smoke tests for src/app/seller/promotions/form.tsx
import PromotionFormScreen from "../../../../app/seller/promotions/form";
import { renderScreen } from "../../../../test/testUtils";

describe("<PromotionFormScreen />", () => {
  it("renders nothing without a store instead of crashing", async () => {
    const { queryByText } = renderScreen(<PromotionFormScreen />);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(queryByText("Add promotion")).toBeNull();
    expect(queryByText("Edit promotion")).toBeNull();
  });
});
