// src/tests/app/addresses.test.tsx — smoke tests for src/app/addresses.tsx
import AddressesScreen from "../../app/addresses";
import { renderScreen } from "../../test/testUtils";

describe("<AddressesScreen />", () => {
  it("renders the header and empty state when signed out", async () => {
    const { findByText } = renderScreen(<AddressesScreen />);
    expect(await findByText("Addresses")).toBeTruthy();
    expect(await findByText("No addresses yet")).toBeTruthy();
  });
});
