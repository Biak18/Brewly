// src/entry.tsx — custom entry point so Sentry initializes before routing.
import "./lib/sentry";
import "expo-router/entry";
