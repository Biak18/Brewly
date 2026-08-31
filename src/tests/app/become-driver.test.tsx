// src/tests/app/become-driver.test.tsx — smoke tests for src/app/become-driver.tsx
import BecomeDriverScreen from "../../app/become-driver";
import { renderScreen } from "../../test/testUtils";

describe("<BecomeDriverScreen />", () => {
  it("renders the driver registration form", async () => {
    const { findByText } = renderScreen(<BecomeDriverScreen />);
    expect(await findByText("Become a driver")).toBeTruthy();
    expect(await findByText("Register as driver")).toBeTruthy();
    expect(await findByText("Full name")).toBeTruthy();
    expect(await findByText("Phone number")).toBeTruthy();
    expect(await findByText("Vehicle")).toBeTruthy();
  });
});
