# Brewly (grab-coffee)

Coffee ordering app for Myanmar — customers order from local roasters, sellers run their shop, drivers deliver. Built with **Expo SDK 57**, React Native, Expo Router, Supabase, and TypeScript (strict).

## Features

- **Customers** — browse shops and menus, customize drinks, cart, checkout with KPay/MMQR manual transfer proof or cash, promo codes, loyalty stamps (free coffee at 10), pickup or delivery, order tracking with status timeline, per-order chat with the shop, push notifications, favorites, search, delivery address book. English + Burmese.
- **Sellers** — store profile with location pin and opening hours, menu + option management, promotions with voucher codes, order queue with status flow and payment verification, earnings summary.
- **Drivers** — availability toggle, assigned deliveries, status transitions (out for delivery → delivered), Google Maps directions, customer chat.

## Getting started

**Prerequisites:** Node 20+, npm, and a Supabase project. The app uses native modules, so run it through a dev build (Expo Go is not enough — push notifications in particular).

1. Install dependencies:

   ```sh
   npm install
   ```

2. Create `.env` from `.env.example` and fill in your values (Supabase URL + anon key are required).

3. Set up the database schema:

   ```sh
   npx supabase link --project-ref <your-project-ref>
   npx supabase db push          # applies supabase/migrations/
   ```

4. Deploy the edge function used for order push notifications:

   ```sh
   npx supabase functions deploy send-order-notification
   ```

   Function secrets (e.g. the Expo push access token) are set in the Supabase dashboard, not in `.env`.

5. Run it:

   ```sh
   npm run android   # or: npm run ios / npm start
   ```

## Scripts

| Command | What it does |
| --- | --- |
| `npm start` | Expo dev server |
| `npm run android` / `npm run ios` | Native dev build and run |
| `npm run typecheck` | `tsc --noEmit` — run before committing |
| `npm run lint` | ESLint (eslint-config-expo) |
| `npm test` | Jest test suite (`src/tests/**`, `src/**/*.test.ts(x)`) |
| `npm run web` | Web dev server |

## Architecture

- `src/app/**` — Expo Router screens. `src/app/(tabs)/` is the tab bar; route groups use parentheses.
- `src/features/<domain>/` — domain logic (components, hooks, api) composed by screens.
- `src/services/` — cross-cutting Supabase API clients (orders, stores, addresses, loyalty, promotions, chat, storage, supabase client).
- `src/stores/` — Zustand global state (auth, cart, network, toast, language, notifications).
- `src/components/ui/` — shared UI primitives (Button, BottomSheet, Toast, EmptyState, …).
- `src/theme/` — design tokens (colors, spacing, radius, typography) via `useTheme()`.
- `src/i18n/` — react-i18next setup; locales in `src/i18n/locales/` (en, my).
- `supabase/migrations/` — Postgres schema, RLS policies, and security-definer RPCs.
- `supabase/functions/` — Deno edge functions.
- `scripts/` — one-off generators (notification icon, i18n key helper).

## Payments

Manual proof-based checkout only (no in-app gateway): KPay (KBZPay) and MMQR are manual transfer methods — the buyer pastes a transaction ID, recorded via `attachPayment`, and the seller verifies it. Cash needs no proof. See `src/app/checkout.tsx` and `src/services/orders.ts`.

## Deployment

- Builds are managed with EAS (`eas build`); `google-services.json` is committed because `app.json` references it for Android FCM.
- Push notifications go through the Expo push service; device tokens live in the `push_tokens` table.
- `EXPO_PUBLIC_*` vars are loaded from `.env` (see `.env.example`). Never commit `.env`.

## Conventions

Coding conventions (path aliases, styling, analytics events, error handling) live in [AGENTS.md](AGENTS.md).

