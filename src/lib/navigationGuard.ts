// src/lib/navigationGuard.ts
// Throttles repeated navigations to the same destination so a rapid
// double-tap on a button (or the launch + notification listeners both
// firing) can't push/replace the same screen multiple times.
import { router } from "expo-router";

const THROTTLE_MS = 700;
let lastHref = "";
let lastAt = 0;

function makeGuarded(fn: (...args: any[]) => void) {
  return (...args: any[]) => {
    const href = args[0];
    const key = typeof href === "string" ? href : JSON.stringify(href ?? {});
    const now = Date.now();
    if (key === lastHref && now - lastAt < THROTTLE_MS) return;
    lastHref = key;
    lastAt = now;
    fn(...args);
  };
}

try {
  const push = router.push.bind(router);
  const replace = router.replace.bind(router);
  Object.assign(router, {
    push: makeGuarded(push),
    replace: makeGuarded(replace),
  });
} catch {
  // If the router singleton isn't patchable on this platform, navigation
  // simply stays unguarded rather than crashing the app.
}
