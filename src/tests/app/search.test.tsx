// src/tests/app/search.test.tsx — smoke tests for src/app/search.tsx
import SearchScreen from "../../app/search";
import { renderScreen } from "../../test/testUtils";

describe("<SearchScreen />", () => {
  it("shows the idle state before typing a query", async () => {
    const { findByText, getByText } = renderScreen(<SearchScreen />);
    expect(await findByText("Search Brewly")).toBeTruthy();
    expect(getByText("Find drinks or shops by name. Try \"latte\".")).toBeTruthy();
  });
});
