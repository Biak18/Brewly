// src/tests/app/become-seller.test.tsx — smoke tests for src/app/become-seller.tsx
import BecomeSellerScreen from "../../app/become-seller";
import { renderScreen } from "../../test/testUtils";

describe("<BecomeSellerScreen />", () => {
  it("renders the seller onboarding form", async () => {
    const { findByText } = renderScreen(<BecomeSellerScreen />);
    expect(await findByText("Become a Seller")).toBeTruthy();
    expect(await findByText("Create my shop")).toBeTruthy();
  });
});
