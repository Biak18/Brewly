// src/tests/app/index.test.tsx — smoke tests for src/app/index.tsx
import Index from "../../app/index";
import { renderScreen } from "../../test/testUtils";

describe("<Index />", () => {
  it("renders the coffee carousel", async () => {
    const { findByText } = renderScreen(<Index />);
    expect(await findByText("Caramel Macchiato")).toBeTruthy();
  });
});
