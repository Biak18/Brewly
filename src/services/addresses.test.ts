import { formatAddressSnapshot } from "./addresses";

describe("formatAddressSnapshot", () => {
  it("formats the address fields in the order snapshot format", () => {
    expect(
      formatAddressSnapshot({
        id: "address-1",
        user_id: "user-1",
        label: "Home",
        full_name: "Aung A",
        phone: "09 123",
        address: "123 Baho Rd",
        lat: null,
        lng: null,
        is_default: true,
        created_at: "2026-08-28T00:00:00.000Z",
      }),
    ).toBe("Home · Aung A · 09 123 · 123 Baho Rd");
  });

  it("trims fields and omits empty values", () => {
    expect(
      formatAddressSnapshot({
        id: "address-1",
        user_id: "user-1",
        label: " Home ",
        full_name: " ",
        phone: "09 123",
        address: " 123 Baho Rd ",
        lat: null,
        lng: null,
        is_default: false,
        created_at: "2026-08-28T00:00:00.000Z",
      }),
    ).toBe("Home · 09 123 · 123 Baho Rd");
  });
});
