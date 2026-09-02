// src/tests/app/coffee/[id].test.tsx: smoke tests for src/app/coffee/[id].tsx
import CoffeeDetailScreen from "../../../app/coffee/[id]";
import { renderScreen } from "../../../test/testUtils";

describe("<CoffeeDetailScreen />", () => {
  it("shows the not-found state for an unknown coffee id", async () => {
    const { findByText } = renderScreen(<CoffeeDetailScreen />);
    expect(await findByText("Couldn't load this coffee")).toBeTruthy();
  });
});
