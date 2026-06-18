# Petspond

Pet services platform: **User App**, **Vet CRM** (web + mobile), and **API**.

## Monorepo structure

```
petspond/
├── apps/
│   ├── api/                 # NestJS backend
│   ├── vet-crm-web/         # Next.js (Vet CRM web)
│   ├── user-app/            # React Native / Expo (User app)
│   ├── vendor-app/          # React Native / Expo (Walkers, trainers, groomers)
│   └── vet-crm-mobile/      # React Native / Expo (Vet CRM mobile)
├── packages/
│   ├── types/               # Shared TypeScript types & DTOs
│   └── api-client/          # Shared API client
├── pnpm-workspace.yaml
├── turbo.json
└── package.json
```

## Prerequisites

- **Node.js** 18+
- **pnpm** (recommended)

If `pnpm install` fails with a **corepack** signature error, use one of these:

```bash
# Option A: Install pnpm globally (recommended), then install
npm install -g pnpm
pnpm install

# Option B: Bypass corepack strict verification for this run
COREPACK_ENABLE_STRICT=0 pnpm install
```

## Setup

```bash
# Install dependencies (from repo root)
pnpm install

# Build shared packages first (types, api-client)
pnpm --filter @petspond/types build
pnpm --filter @petspond/api-client build
```

## Run

| App              | Command                    |
|------------------|----------------------------|
| API              | `pnpm dev:api`             |
| Vet CRM Web      | `pnpm dev:web`             |
| User App (Expo)  | `pnpm dev:user-app`        |
| Vendor App (Expo)| `pnpm dev:vendor-app`      |
| Vet CRM Mobile   | `pnpm dev:vet-mobile`      |

Or from the root: `pnpm dev` (runs all in parallel via Turbo).

## Environment

- **API:** Copy `apps/api/.env.example` to `apps/api/.env.local` and set `MONGODB_URI` (and optionally Redis, JWT, OTP). For images, configure **Cloudflare R2** — see [apps/api/CLOUDFLARE_R2_SETUP.md](apps/api/CLOUDFLARE_R2_SETUP.md).
- **Vet CRM Web:** Set `NEXT_PUBLIC_API_URL=http://localhost:3000` in `apps/vet-crm-web/.env.local` if needed.
- **Mobile apps:** Set `EXPO_PUBLIC_API_URL` in `.env` for the app if not using default (see `apps/user-app/.env.example`, `apps/vendor-app/.env.example`).
- **Vendors:** Groomers, walkers, and trainers onboard via **Vendor App** (`vendor-auth` API). Pet parents see listings filtered by location and service radius on the user app (`GET /public/vendors`).

## Theming & providers (frontends)

- **Vet CRM Web (Next.js):** Theme tokens in `src/theme/`, CSS variables in `src/theme/css-variables.css`. `ThemeProvider` and `ApiProvider` in `src/contexts/`; root layout wraps the app with `Providers` in `src/app/providers.tsx`.
- **User App & Vet CRM Mobile (Expo):** Theme in `src/theme/index.ts`, `ThemeProvider` and `ApiProvider` in `src/contexts/`. Root layout in `app/_layout.tsx` wraps with `Providers` from `src/app/providers.tsx`.

Change theme tokens in the respective `src/theme` (or CSS variables for web) to update the app look app-wide.

## Build

```bash
pnpm build
```

Builds all apps and packages (Turbo respects dependency order).

## Deployment

Vet CRM Web (Netlify) + API (Railway) + MongoDB Atlas — see **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** for the full development and production setup guide.
