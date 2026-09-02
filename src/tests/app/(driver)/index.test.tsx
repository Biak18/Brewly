// src/tests/app/(driver)/index.test.tsx: smoke tests for the driver home
import DriverHome from "../../../app/(driver)/index";
import { renderScreen } from "../../../test/testUtils";

describe("<DriverHome />", () => {
  it("renders the empty deliveries state when signed out", async () => {
    const { findByText, queryByText } = renderScreen(<DriverHome />);
    expect(await findByText("No deliveries assigned right now")).toBeTruthy();
    // The availability toggle only exists for a signed-in driver.
    expect(queryByText("Available for deliveries")).toBeNull();
  });
});
