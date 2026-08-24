// src/lib/sentry.ts
// Initializes Sentry as early as possible. No-ops without a DSN so local
// dev, tests, and CI stay clean until EXPO_PUBLIC_SENTRY_DSN is provided.
import * as Sentry from "@sentry/react-native";

const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    sendDefaultPii: false,
  });
}

export function captureException(error: unknown) {
  if (!dsn) return;
  Sentry.captureException(error);
}
