// src/entry.tsx — custom entry point so Sentry initializes before routing.
import "./lib/sentry";
import "./lib/navigationGuard";
import "expo-router/entry";
