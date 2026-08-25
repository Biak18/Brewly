// src/lib/analytics.ts
// Lightweight product-analytics event bus. Ships a __DEV__ console sink so
// funnels are observable locally without any external dependency; production
// providers can be attached later via addAnalyticsSink() without touching
// call sites.

export type AnalyticsEvent =
  | "screen_view"
  | "coffee_viewed"
  | "shop_viewed"
  | "add_to_cart"
  | "checkout_started"
  | "order_placed";

export type AnalyticsProps = Record<
  string,
  string | number | boolean | null | undefined
>;

type AnalyticsSink = (event: AnalyticsEvent, props?: AnalyticsProps) => void;

const sinks: AnalyticsSink[] = [
  ...(process.env.NODE_ENV !== "test"
    ? [
        (event: AnalyticsEvent, props?: AnalyticsProps) => {
          if (__DEV__) {
            const suffix = props ? ` ${JSON.stringify(props)}` : "";
            console.log(`[analytics] ${event}${suffix}`);
          }
        },
      ]
    : []),
];

export function addAnalyticsSink(sink: AnalyticsSink): () => void {
  sinks.push(sink);
  return () => {
    const index = sinks.indexOf(sink);
    if (index !== -1) sinks.splice(index, 1);
  };
}

export function track(event: AnalyticsEvent, props?: AnalyticsProps) {
  for (const sink of sinks) {
    try {
      sink(event, props);
    } catch {
      // A failing sink must never break the app.
    }
  }
}
