// src/tests/app/seller/menu/coffee-form.test.tsx: smoke tests for src/app/seller/menu/coffee-form.tsx
import CoffeeFormScreen from "../../../../app/seller/menu/coffee-form";
import { renderScreen } from "../../../../test/testUtils";

describe("<CoffeeFormScreen />", () => {
  it("renders nothing without a store instead of crashing", async () => {
    const { queryByText } = renderScreen(<CoffeeFormScreen />);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(queryByText("Add coffee")).toBeNull();
  });
});
