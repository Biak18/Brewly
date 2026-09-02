// src/services/sellerEarnings.ts
// Sales summary for the seller's own store. Aggregation happens client-side
// over the store's orders (narrow columns only), RLS already restricts this
// query to the store owner.
import { supabase } from "./supabase";

export type SellerEarningsRow = {
  status: string;
  total: number;
  placed_at: string;
};

export type SellerEarnings = {
  today: number;
  week: number;
  month: number;
  avgOrder: number;
  completedCount: number;
  openOrders: number;
};

const OPEN_STATUSES = new Set(["received", "preparing", "ready"]);
const DAY_MS = 24 * 60 * 60 * 1000;

function startOfLocalDay(now: Date): number {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function computeSellerEarnings(
  rows: SellerEarningsRow[],
  now: Date = new Date(),
): SellerEarnings {
  const todayStart = startOfLocalDay(now);
  const weekStart = todayStart - 6 * DAY_MS;
  const monthStart = todayStart - 29 * DAY_MS;

  let today = 0;
  let week = 0;
  let month = 0;
  let monthCount = 0;
  let completedCount = 0;
  let openOrders = 0;

  for (const row of rows) {
    if (row.status === "completed") {
      completedCount += 1;
      const placed = new Date(row.placed_at).getTime();
      if (placed >= todayStart) {
        today += row.total;
        week += row.total;
        month += row.total;
        monthCount += 1;
      } else if (placed >= weekStart) {
        week += row.total;
        month += row.total;
        monthCount += 1;
      } else if (placed >= monthStart) {
        month += row.total;
        monthCount += 1;
      }
    } else if (OPEN_STATUSES.has(row.status)) {
      openOrders += 1;
    }
  }

  return {
    today: round2(today),
    week: round2(week),
    month: round2(month),
    avgOrder: monthCount > 0 ? round2(month / monthCount) : 0,
    completedCount,
    openOrders,
  };
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export async function fetchSellerEarnings(
  storeId: string,
): Promise<SellerEarnings> {
  // Only the last ~30 days can influence the aggregates, bound the query so
  // the payload stays constant-size as order history grows.
  const monthStart = new Date();
  monthStart.setHours(0, 0, 0, 0);
  monthStart.setDate(monthStart.getDate() - 29);
  const { data, error } = await supabase
    .from("orders")
    .select("status, total, placed_at")
    .eq("store_id", storeId)
    .gte("placed_at", monthStart.toISOString());
  if (error) throw error;
  return computeSellerEarnings((data ?? []) as SellerEarningsRow[]);
}
