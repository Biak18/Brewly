// src/tests/app/(tabs)/favorites.test.tsx: smoke tests for src/app/(tabs)/favorites.tsx
import FavoritesScreen from "../../../app/(tabs)/favorites";
import { renderScreen } from "../../../test/testUtils";

describe("<FavoritesScreen />", () => {
  it("shows the empty state when there are no favorites", async () => {
    const { findByText } = renderScreen(<FavoritesScreen />);
    expect(await findByText("No favorites yet")).toBeTruthy();
  });
});
