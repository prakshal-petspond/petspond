# Petspond deployment guide

Deploy **Vet CRM Web** on Netlify, the **NestJS API** on Railway, and **PostgreSQL** on Railway (or any managed Postgres) — with separate **development** and **production** environments (no staging).

| Component | Platform | Dev | Production |
|-----------|----------|-----|------------|
| Vet CRM Web | Netlify | `develop` branch | `main` branch |
| API | Railway | `develop` branch service | `main` branch service |
| Database | PostgreSQL (Railway) | `petspond-dev` | `petspond-prod` |

---

## Architecture

```
┌─────────────────────┐         HTTPS          ┌─────────────────────┐
│  Netlify            │  NEXT_PUBLIC_API_URL   │  Railway            │
│  Vet CRM Web        │ ─────────────────────► │  NestJS API         │
│  (Next.js)          │                        │  (port from PORT)   │
└─────────────────────┘                        └──────────┬──────────┘
                                                          │
                                                          │ DATABASE_URL
                                                          ▼
                                               ┌─────────────────────┐
                                               │  PostgreSQL         │
                                               │  (Railway Postgres) │
                                               └─────────────────────┘
```

---

## Prerequisites

- GitHub repo connected to Netlify and Railway
- Two git branches: `main` (production) and `develop` (development)
- Accounts: [Railway](https://railway.app), [Netlify](https://www.netlify.com)
- Optional but recommended: [Resend](https://resend.com) (email OTP), [Cloudflare R2](apps/api/CLOUDFLARE_R2_SETUP.md) (uploads), Google Cloud (OAuth + Maps)

---

## Step 1 — PostgreSQL

### 1.1 Create databases on Railway

For each environment (dev and prod):

1. In the Railway project → **New** → **Database** → **PostgreSQL**.
2. Name them clearly (e.g. `petspond-pg-dev`, `petspond-pg-prod`).
3. Open the Postgres service → **Variables** → copy `DATABASE_URL` (or `POSTGRES_URL`).

Use a **separate** Postgres instance (or at least a separate database name) for development and production.

### 1.2 Local development

```bash
# Example local URL — create a DB named petspond
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/petspond?schema=public
```

Then from `apps/api`:

```bash
pnpm prisma:migrate:dev   # create/apply migrations in development
# or
pnpm prisma:migrate       # apply existing migrations (CI / prod-like)
```

The API Docker image runs `prisma migrate deploy` on startup.

---

## Step 2 — Railway (API)

Create **two services** from the same GitHub repo.

### 2.1 Create development API

1. Railway → **New Project** → **Deploy from GitHub repo** → select `petspond`.
2. Name the service **`petspond-api-dev`**.
3. **Settings** → **Source** → set **Branch** to `develop`.
4. **Settings** → **Build** → confirm Dockerfile path: `apps/api/Dockerfile` (from `railway.toml`).
5. **Settings** → **Networking** → **Generate Domain** (e.g. `petspond-api-dev.up.railway.app`).
6. Link the **dev** Postgres service (or paste `DATABASE_URL`).

### 2.2 Create production API

1. In the same project (or a separate one): **New Service** → same repo.
2. Name it **`petspond-api-prod`**.
3. Set **Branch** to `main`.
4. Generate a public domain.
5. Link the **prod** Postgres service.

### 2.3 Environment variables

Set these on **each** Railway service (**Variables** tab). Values differ per environment.

#### Shared variable reference

| Variable | Dev example | Prod example | Notes |
|----------|-------------|--------------|-------|
| `NODE_ENV` | `development` | `production` | |
| `DATABASE_URL` | Railway Postgres URL | Railway Postgres URL | From Postgres service |
| `JWT_SECRET` | random 32+ chars | **different** random secret | `openssl rand -base64 32` |
| `API_PUBLIC_URL` | `https://petspond-api-dev.up.railway.app` | `https://petspond-api-prod.up.railway.app` | Railway public URL |
| `CORS_ORIGINS` | `https://petspond-vet-dev.netlify.app,http://localhost:3001` | `https://petspond-vet-prod.netlify.app` | Comma-separated, no trailing slash |
| `EMAIL_PROVIDER` | `resend` | `resend` | |
| `RESEND_API_KEY` | your key | your key | Same or separate Resend projects |
| `EMAIL_FROM` | verified sender | verified domain sender | e.g. `noreply@yourdomain.com` |
| `GOOGLE_CLIENT_ID` | Web client ID | same or separate client | Must match frontend |
| `OTP_BYPASS` | `true` | **`false`** | Never bypass OTP in prod |
| `OTP_BYPASS_CODE` | `123456` | (ignored if bypass off) | |
| `R2_ACCOUNT_ID` | … | … | See [CLOUDFLARE_R2_SETUP.md](../apps/api/CLOUDFLARE_R2_SETUP.md) |
| `R2_ACCESS_KEY_ID` | … | … | |
| `R2_SECRET_ACCESS_KEY` | … | … | |
| `R2_BUCKET_NAME` | `petspond-dev` | `petspond-prod` | Separate buckets recommended |
| `STRIPE_SECRET_KEY` | test key | live key | If using payments |

`PORT` is injected automatically by Railway — do not override it.

### 2.4 Deploy and verify

After the first deploy:

```bash
curl https://petspond-api-dev.up.railway.app/health
# → {"status":"ok","postgres":"connected","timestamp":"…"}
```

Repeat for production.

---

## Step 3 — Netlify (Vet CRM Web)

Create **two sites** from the same repo.

### 3.1 Development site

1. Netlify → **Add new site** → **Import from Git** → select `petspond`.
2. Site name: e.g. **`petspond-vet-dev`**.
3. **Build settings** (should auto-detect from `netlify.toml`):
   - **Build command:** `pnpm install --frozen-lockfile && pnpm --filter @petspond/vet-crm-web... build`
   - **Publish directory:** `apps/vet-crm-web/.next`
   - **Base directory:** leave empty (repo root)
4. **Deploy contexts** → **Branch deploys** → set production branch to **`develop`** for this site  
   *(or use Site settings → Build & deploy → Deploy contexts)*.

### 3.2 Production site

1. Create another site: **`petspond-vet-prod`**.
2. Same build settings.
3. Production branch: **`main`**.

### 3.3 Environment variables (per site)

| Variable | Dev site | Prod site |
|----------|----------|-----------|
| `NEXT_PUBLIC_API_URL` | `https://petspond-api-dev.up.railway.app` | `https://petspond-api-prod.up.railway.app` |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google Web client ID | Same or prod client |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Maps key (HTTP referrer restricted) | Maps key |

Redeploy after changing `NEXT_PUBLIC_*` variables (they are baked in at build time).

### 3.4 Custom domains (optional)

1. Netlify → **Domain management** → add your domain.
2. Update `CORS_ORIGINS` on the matching Railway service to include the new URL.
3. Update Google OAuth **Authorized JavaScript origins** and Maps API **HTTP referrers**.

---

## Step 4 — Google Cloud (OAuth + Maps)

### OAuth (Vet CRM sign-in)

1. [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services** → **Credentials**.
2. Create **OAuth 2.0 Client ID** → **Web application**.
3. **Authorized JavaScript origins:**

   ```
   http://localhost:3001
   https://petspond-vet-dev.netlify.app
   https://petspond-vet-prod.netlify.app
   https://your-custom-domain.com
   ```

4. Set the client ID in:
   - Netlify: `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
   - Railway: `GOOGLE_CLIENT_ID`

### Maps (clinic onboarding)

1. Enable **Maps JavaScript API** and **Places API**.
2. Create an API key; restrict by HTTP referrer to your Netlify domains.
3. Set `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` on each Netlify site.

---

## Step 5 — Resend (email OTP)

1. Create a [Resend](https://resend.com) account.
2. For dev: `onboarding@resend.dev` works but only sends to your Resend account email.
3. For prod: verify your domain and set `EMAIL_FROM=noreply@yourdomain.com`.
4. Add `RESEND_API_KEY` to both Railway services.

---

## Step 6 — Wire CORS (critical)

After Netlify deploys, copy each site URL and set `CORS_ORIGINS` on the **matching** Railway API:

```
# petspond-api-dev
CORS_ORIGINS=https://petspond-vet-dev.netlify.app,http://localhost:3001

# petspond-api-prod
CORS_ORIGINS=https://petspond-vet-prod.netlify.app
```

---

## Local development

```bash
pnpm install
cp apps/api/.env.example apps/api/.env.local   # set DATABASE_URL, JWT_SECRET, etc.
pnpm --filter @petspond/api prisma:migrate:dev
pnpm --filter @petspond/api dev
pnpm --filter @petspond/vet-crm-web dev
```

Point `DATABASE_URL` at local Postgres or Railway Postgres (dev).

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| API 502 / not starting | Bad `DATABASE_URL` or migrate failed | Check Postgres linkage + Railway logs for Prisma migrate errors |
| `/health` shows `postgres: disconnected` | DB unreachable | Verify `DATABASE_URL`, network, credentials |
| CORS errors in browser | Missing Netlify origin | Update `CORS_ORIGINS` |
| Email OTP not arriving | Resend limits / unverified domain | Check Resend dashboard; use `OTP_BYPASS` only in dev |

---

## Cost notes

- **Railway Postgres:** hobby/pro plans depending on usage
- **Railway API:** usage-based
- **Netlify:** free tier often enough for Vet CRM
