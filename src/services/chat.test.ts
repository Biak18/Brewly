// src/services/chat.test.ts
import { normalizeMessageBody } from "./chat";

describe("normalizeMessageBody", () => {
  it("trims and collapses internal whitespace", () => {
    expect(normalizeMessageBody("  hi   there  ")).toBe("hi there");
  });

  it("caps length at 1000 characters", () => {
    const long = "a".repeat(1500);
    expect(normalizeMessageBody(long)).toHaveLength(1000);
    expect(normalizeMessageBody(long)).toBe("a".repeat(1000));
  });

  it("returns an empty string for whitespace-only input", () => {
    expect(normalizeMessageBody("   \n\t  ")).toBe("");
  });
});
