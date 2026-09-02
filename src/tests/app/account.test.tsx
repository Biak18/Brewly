// src/tests/app/account.test.tsx: smoke tests for src/app/account.tsx
import AccountScreen from "../../app/account";
import { useAuthStore } from "../../stores/authStore";
import { renderScreen } from "../../test/testUtils";

describe("<AccountScreen />", () => {
  afterEach(() => {
    useAuthStore.setState({ session: null, profile: null });
  });

  it("renders profile, password, and danger sections", async () => {
    useAuthStore.setState({
      session: { user: { id: "u1", email: "test@example.com" } } as any,
      profile: {
        id: "u1",
        full_name: "Chan Myae",
        avatar_url: null,
        role: "customer",
      },
    });
    const { findByText, getByText, getByDisplayValue } = renderScreen(
      <AccountScreen />,
    );
    expect(await findByText("Account settings")).toBeTruthy();
    expect(getByText("test@example.com")).toBeTruthy();
    expect(getByDisplayValue("Chan Myae")).toBeTruthy();
    expect(getByText("Save name")).toBeTruthy();
    expect(getByText("Update password")).toBeTruthy();
    expect(getByText("Delete account")).toBeTruthy();
  });
});
