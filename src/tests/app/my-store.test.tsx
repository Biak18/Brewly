// src/tests/app/my-store.test.tsx: smoke tests for src/app/my-store.tsx
import MyStoreScreen from "../../app/my-store";
import { renderScreen } from "../../test/testUtils";

describe("<MyStoreScreen />", () => {
  it("shows the no-store state when signed out", async () => {
    const { findByText } = renderScreen(<MyStoreScreen />);
    expect(await findByText("My Store")).toBeTruthy();
    expect(await findByText("No store found")).toBeTruthy();
  });
});
