# Brewly

Brewly is an Expo 57 coffee ordering app with customer ordering, pickup and
delivery checkout, loyalty rewards, promotions, seller menu management, and
KPay/MMQR payment proof support.

## Requirements

- Node.js 22.13 or newer
- Android Studio and an Android emulator or device for Android development
- Xcode 16.4 or newer for iOS development
- A Supabase project for authentication, data, storage, and realtime updates

Install dependencies:

```powershell
npm install
```

## Environment

Create a `.env` file in the project root:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_SENTRY_DSN=optional-sentry-dsn
SENTRY_AUTH_TOKEN=optional-sentry-token
SENTRY_ORG=optional-sentry-organization
SENTRY_PROJECT=optional-sentry-project
```

Do not commit `.env`, service-role keys, database passwords, or signing keys.

## Supabase

The linked project reference is stored in `supabase/.temp/project-ref`.
Apply migrations to the linked project with:

```powershell
npx supabase db push --linked
```

The migrations contain authoritative order pricing, idempotent checkout,
address-default handling, RLS policies, payment authorization, and seller
ownership checks.

Run database tests locally when Docker is available:

```powershell
npx supabase start
npx supabase test db --local
```

## Development

Start the Expo development server:

```powershell
npm start
```

Run on Android, iOS, or web:

```powershell
npm run android
npm run ios
npm run web
```

The app uses the `brewly` URL scheme. Development links use the Expo Router
development URL; production links use `brewly://`.

## Validation

```powershell
npm run typecheck
npm run lint
npm test -- --runInBand
```

The test suite covers customer screens, seller screens, cart behavior, order
pricing helpers, address snapshots, and store-hours logic.

## Builds

EAS profiles are defined in `eas.json`:

```powershell
npx eas build --profile development
npx eas build --profile preview
npx eas build --profile production
npx eas submit --profile production
```

Production Android signing must be configured before publishing. The checked-in
native project should not be used to publish a debug-signed release build.

## Project Structure

- `src/app`: Expo Router screens and layouts
- `src/features`: feature components, hooks, and API logic
- `src/services`: Supabase services and domain operations
- `src/stores`: Zustand state stores
- `src/utils`: pricing, currency, geography, and validation helpers
- `supabase/migrations`: versioned database changes
- `supabase/tests`: pgTAP database tests
