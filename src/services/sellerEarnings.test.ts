// src/services/sellerEarnings.test.ts
import { computeSellerEarnings, SellerEarningsRow } from "./sellerEarnings";

const DAY_MS = 24 * 60 * 60 * 1000;

function row(overrides: Partial<SellerEarningsRow>): SellerEarningsRow {
  return { status: "completed", total: 10, placed_at: new Date().toISOString(), ...overrides };
}

// Fixed "now": a Wednesday, 15:00 local time.
const NOW = new Date(new Date().setHours(15, 0, 0, 0));

describe("computeSellerEarnings", () => {
  it("sums today's completed revenue only", () => {
    const earnings = computeSellerEarnings(
      [
        row({ total: 8.5, placed_at: new Date(NOW.getTime() - 2 * 3600_000).toISOString() }),
        row({ total: 4, placed_at: new Date(NOW.getTime() - 3 * DAY_MS).toISOString() }),
      ],
      NOW,
    );
    expect(earnings.today).toBe(8.5);
    expect(earnings.week).toBe(12.5);
    expect(earnings.month).toBe(12.5);
  });

  it("buckets orders into week and month windows", () => {
    const earnings = computeSellerEarnings(
      [
        row({ total: 6, placed_at: new Date(NOW.getTime() - 3 * DAY_MS).toISOString() }),
        row({ total: 5, placed_at: new Date(NOW.getTime() - 10 * DAY_MS).toISOString() }),
        row({ total: 1, placed_at: new Date(NOW.getTime() - 40 * DAY_MS).toISOString() }),
      ],
      NOW,
    );
    expect(earnings.today).toBe(0);
    expect(earnings.week).toBe(6);
    expect(earnings.month).toBe(11);
    expect(earnings.completedCount).toBe(3);
  });

  it("ignores cancelled orders and counts open ones", () => {
    const earnings = computeSellerEarnings(
      [
        row({ status: "cancelled", total: 99 }),
        row({ status: "received", total: 7 }),
        row({ status: "ready", total: 3 }),
      ],
      NOW,
    );
    expect(earnings.today).toBe(0);
    expect(earnings.openOrders).toBe(2);
    expect(earnings.completedCount).toBe(0);
  });

  it("derives average order value from the 30-day window", () => {
    const earnings = computeSellerEarnings(
      [
        row({ total: 10 }),
        row({ total: 6, placed_at: new Date(NOW.getTime() - DAY_MS).toISOString() }),
        row({ total: 100, placed_at: new Date(NOW.getTime() - 60 * DAY_MS).toISOString() }),
      ],
      NOW,
    );
    expect(earnings.avgOrder).toBe(8);
  });

  it("returns zeroes for an empty store", () => {
    expect(computeSellerEarnings([], NOW)).toEqual({
      today: 0,
      week: 0,
      month: 0,
      avgOrder: 0,
      completedCount: 0,
      openOrders: 0,
    });
  });

  it("includes an order placed just after local midnight in today", () => {
    const midnight = new Date(new Date(NOW).setHours(0, 0, 0, 0));
    const earnings = computeSellerEarnings(
      [row({ total: 2.5, placed_at: new Date(midnight.getTime() + 60_000).toISOString() })],
      NOW,
    );
    expect(earnings.today).toBe(2.5);
  });
});
