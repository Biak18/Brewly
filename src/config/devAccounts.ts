// src/config/devAccounts.ts
// DEV-ONLY quick-switch accounts for single-device testing.
// This file is committed with PLACEHOLDERS only — replace with your real
// test passwords locally. Do NOT commit real passwords.
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
