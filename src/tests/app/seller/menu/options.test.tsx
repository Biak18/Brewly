// src/tests/app/seller/menu/options.test.tsx — smoke tests for src/app/seller/menu/options.tsx
import ManageOptionsScreen from "../../../../app/seller/menu/options";
import { renderScreen } from "../../../../test/testUtils";

describe("<ManageOptionsScreen />", () => {
  it("renders nothing without a store instead of crashing", async () => {
    const { queryByText } = renderScreen(<ManageOptionsScreen />);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(queryByText("Size")).toBeNull();
  });
});
