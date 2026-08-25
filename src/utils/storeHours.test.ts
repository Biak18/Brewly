// src/utils/storeHours.test.ts
import {
  formatMinutes,
  getStoreOpenState,
  parseStoreHours,
} from "./storeHours";

const at = (h: number, m = 0) => new Date(2026, 0, 1, h, m);

describe("parseStoreHours", () => {
  it("parses a valid window", () => {
    expect(parseStoreHours({ open: "06:30", close: "18:30" })).toEqual({
      open: 390,
      close: 1110,
    });
  });

  it("rejects missing or malformed hours", () => {
    expect(parseStoreHours(null)).toBeNull();
    expect(parseStoreHours(undefined)).toBeNull();
    expect(parseStoreHours({})).toBeNull();
    expect(parseStoreHours({ open: "6am", close: "18:30" })).toBeNull();
    expect(parseStoreHours({ open: "25:00", close: "18:30" })).toBeNull();
    // open === close is a zero-length window, treat as unparseable
    expect(parseStoreHours({ open: "09:00", close: "09:00" })).toBeNull();
  });
});

describe("formatMinutes", () => {
  it("formats zero-padded HH:MM", () => {
    expect(formatMinutes(390)).toBe("06:30");
    expect(formatMinutes(1110)).toBe("18:30");
  });
});

describe("getStoreOpenState", () => {
  const hours = { open: "06:30", close: "18:30" };

  it("is open inside the window and reports closing time", () => {
    const state = getStoreOpenState(hours, at(10));
    expect(state).toMatchObject({
      isOpen: true,
      isKnown: true,
      closesAt: "18:30",
      opensAt: "06:30",
    });
  });

  it("is closed outside the window and reports opening time", () => {
    const state = getStoreOpenState(hours, at(5));
    expect(state.isOpen).toBe(false);
    expect(state.opensAt).toBe("06:30");
  });

  it("treats the open boundary as open and the close boundary as closed", () => {
    expect(getStoreOpenState(hours, at(6, 30)).isOpen).toBe(true);
    expect(getStoreOpenState(hours, at(18, 30)).isOpen).toBe(false);
  });

  it("supports windows wrapping past midnight", () => {
    const overnight = { open: "20:00", close: "02:00" };
    expect(getStoreOpenState(overnight, at(23)).isOpen).toBe(true);
    expect(getStoreOpenState(overnight, at(1)).isOpen).toBe(true);
    expect(getStoreOpenState(overnight, at(12)).isOpen).toBe(false);
  });

  it("never blocks when hours are unknown", () => {
    const state = getStoreOpenState(null, at(3));
    expect(state.isKnown).toBe(false);
    expect(state.isOpen).toBe(true);
  });
});
