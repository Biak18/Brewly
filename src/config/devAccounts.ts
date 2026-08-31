// src/config/devAccounts.ts
// DEV-ONLY quick-switch accounts for single-device testing.
// COMMITTED with PLACEHOLDERS only — CI needs this file to exist.
// For real credentials: create src/config/devAccounts.local.ts (gitignored) with the same shape,
// or edit this file locally and run: git update-index --skip-worktree src/config/devAccounts.ts
// The switcher is gated by `__DEV__` and never renders in production.

export type DevAccount = {
  label: string;
  email: string;
  password: string;
  role: "customer" | "seller" | "driver";
};

export const DEV_ACCOUNTS: DevAccount[] = [
  { label: "Customer", email: "customer@test.com", password: "password123", role: "customer" },
  { label: "Seller", email: "seller@test.com", password: "password123", role: "seller" },
  { label: "Driver", email: "driver@test.com", password: "password123", role: "driver" },
];
