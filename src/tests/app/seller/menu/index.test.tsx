// src/tests/app/seller/menu/index.test.tsx: smoke tests for src/app/seller/menu/index.tsx
import ManageMenuScreen from "../../../../app/seller/menu/index";
import { renderScreen } from "../../../../test/testUtils";

describe("<ManageMenuScreen />", () => {
  it("renders the manage menu header and empty state", async () => {
    const { findByText } = renderScreen(<ManageMenuScreen />);
    expect(await findByText("Manage Menu")).toBeTruthy();
    expect(await findByText("No coffees yet")).toBeTruthy();
  });
});
