// src/utils/storeHours.ts
// Stores keep hours as simple { open: "HH:MM", close: "HH:MM" } JSON.
// Evaluation uses the device's local time (shops and customers are both in
// Myanmar today); a close time earlier than or equal to the open time means
// the window wraps past midnight.

export type ParsedStoreHours = {
  open: number;
  close: number;
} | null;

function toMinutes(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h > 23 || m > 59) return null;
  return h * 60 + m;
}

export function parseStoreHours(hours: unknown): ParsedStoreHours {
  if (!hours || typeof hours !== "object") return null;
  const open = toMinutes((hours as any).open);
  const close = toMinutes((hours as any).close);
  if (open === null || close === null || open === close) return null;
  return { open, close };
}

export function formatMinutes(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export type StoreOpenState = {
  /** true when hours are missing/unparseable, never block on bad data */
  isOpen: boolean;
  isKnown: boolean;
  closesAt: string | null;
  opensAt: string | null;
};

export function getStoreOpenState(
  hours: unknown,
  now: Date = new Date(),
): StoreOpenState {
  const parsed = parseStoreHours(hours);
  if (!parsed) {
    return { isOpen: true, isKnown: false, closesAt: null, opensAt: null };
  }

  const minutesNow = now.getHours() * 60 + now.getMinutes();
  const overnight = parsed.close < parsed.open;

  let isOpen: boolean;
  if (overnight) {
    isOpen = minutesNow >= parsed.open || minutesNow < parsed.close;
  } else {
    isOpen = minutesNow >= parsed.open && minutesNow < parsed.close;
  }

  return {
    isOpen,
    isKnown: true,
    closesAt: formatMinutes(parsed.close),
    opensAt: formatMinutes(parsed.open),
  };
}
