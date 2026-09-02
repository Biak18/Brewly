// src/tests/app/my-store/edit.test.tsx: smoke tests for src/app/my-store/edit.tsx
import EditStoreScreen from "../../../app/my-store/edit";
import { renderScreen } from "../../../test/testUtils";

describe("<EditStoreScreen />", () => {
  it("renders nothing without a store instead of crashing", async () => {
    const { queryByText } = renderScreen(<EditStoreScreen />);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(queryByText("Store settings")).toBeNull();
  });
});
