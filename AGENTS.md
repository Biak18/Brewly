# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

# grab-coffee

Coffee ordering app (customer + seller) built with Expo SDK 57 and React Native.

## Stack

- **Expo SDK 57** (`~57.0.17`), React Native, **TypeScript** (strict, `tsc --noEmit`).
- **Expo Router** — file-based routing. Screens live in `src/app/**`; `src/app/(tabs)/` is the tab bar. Route groups use parentheses in folder names (e.g. `src/app/(tabs)/`).
- **Supabase** — Postgres + Auth + Realtime + Edge Functions (Deno). Client in `src/services/supabase.ts`.
- **Zustand** — global state in `src/stores/` (auth, cart, network, toast). Access via selector: `useAuthStore((s) => s.session)`.
- **React Query** (`@tanstack/react-query`) — server state/data fetching in feature `hooks/`.
- **react-hook-form + zod** — forms and validation (`zodResolver`).
- **lucide-react-native** — icons.

## Conventions

- **Path alias:** `@/*` maps to `./src/*`. Always import with `@/` (e.g. `import { track } from "@/lib/analytics"`), never relative `../` chains.
- **Styling:** inline React Native styles via `useTheme()` from `@/theme` — use `colors`, `spacing`, `radius`, `typography`. No Tailwind/CSS. UI primitives live in `src/components/ui/`.
- **Feature layout:** `src/features/<domain>/` holds domain logic (components, hooks, api). `src/app/**` screens compose them. `src/services/` holds cross-cutting API clients (orders, stores, addresses, loyalty, promotions, supabase).
- **Currency:** use `formatCurrency` from `@/utils/currency`.
- **Analytics:** `track("event_name", { props })` from `src/lib/analytics`. Event names are a closed union in `AnalyticsEvent`.
- **Errors:** services throw `Error` with human-readable messages (e.g. `"Menu price changed"`). Catch and surface via the toast store; never let a failed side-effect (e.g. `attachPayment`) drop the already-created order.

## Payments

Manual proof-based checkout only (no in-app gateway):
- `kpay` (KBZPay) and `mmqr` are manual transfer methods. The buyer pastes a transaction ID into `KpayPanel` (`src/features/checkout/components/KpayPanel.tsx`); `attachPayment(orderId, method, ref)` records it.
- `cash` needs no proof.
- See `src/app/checkout.tsx` for the flow and `src/services/orders.ts` (`placeOrder`, `attachPayment`, `DELIVERY_FEE`).

## Supabase

- **Migrations:** `supabase/migrations/`. Use `supabase apply_migration` / CLI for DDL. Enable RLS on new tables and add policies.
- **Edge Functions:** `supabase/functions/<name>/index.ts` (Deno). Invoke from app via `supabase.functions.invoke("name", { body })`. Function secrets set in Supabase dashboard, not in `.env`.
- **Env:** app/Expo public vars go in `.env` as `EXPO_PUBLIC_*` (loaded by Expo). Never commit secrets; `.env` is gitignored.

## Scripts

- `npm run typecheck` — `tsc --noEmit` (run after edits).
- `npm run lint` — `expo lint` (eslint-config-expo).
- `npm run test` — `jest` (tests in `src/tests/**` and `src/**/*.test.ts(x)`).
- `npm start` / `npm run android` / `npm run ios` — Expo dev client (native modules require a dev build, not Expo Go).

## Before committing

Run `npm run typecheck` and `npm run lint`. Do not commit secrets or `.env`.
