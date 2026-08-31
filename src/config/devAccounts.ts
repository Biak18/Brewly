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
  {
    label: "Customer",
    email: "stockflow912@gmail.com",
    password: "stockflow",
    role: "customer",
  },
  {
    label: "Seller",
    email: "biakceu912@gmail.com",
    password: "Biak18*",
    role: "seller",
  },
  {
    label: "Driver",
    email: "eithinzarhtun@gmail.com",
    password: "Biak18*",
    role: "driver",
  },
];
